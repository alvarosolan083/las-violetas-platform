import {
    BadRequestException,
    Controller,
    Delete,
    Get,
    NotFoundException,
    Param,
    Post,
    Req,
    Res,
    UploadedFile,
    UseGuards,
    UseInterceptors,
} from "@nestjs/common";
import type { Response } from "express";
import { FileInterceptor } from "@nestjs/platform-express";
import { diskStorage } from "multer";
import { extname, join } from "path";
import { createReadStream, existsSync, mkdirSync } from "fs";
import {
    ApiBearerAuth,
    ApiBody,
    ApiConsumes,
    ApiCreatedResponse,
    ApiForbiddenResponse,
    ApiOkResponse,
    ApiOperation,
    ApiTags,
    ApiUnauthorizedResponse,
} from "@nestjs/swagger";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { CondoMemberGuard } from "../condo/condo-member.guard";
import { TicketAttachmentsService } from "./ticket-attachments.service";
import { CreateAttachmentDto } from "./dto/create-attachment.dto";

/* ── Helpers ── */

const ALLOWED_MIMES = [
    "image/jpeg",
    "image/png",
    "image/webp",
    "application/pdf",

    // Word
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    // Excel
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    // PowerPoint
    "application/vnd.ms-powerpoint",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    // Texto
    "text/plain",


];

function sanitizeFileName(name: string) {
    return name
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-zA-Z0-9-_]/g, "_")
        .toLowerCase();
}

/* ── Directorio de subida (absoluto, basado en process.cwd()) ── */
const TICKETS_UPLOAD_DIR = join(process.cwd(), "uploads", "tickets");

if (!existsSync(TICKETS_UPLOAD_DIR)) {
    mkdirSync(TICKETS_UPLOAD_DIR, { recursive: true });
}

@ApiTags("ticket-attachments")
@ApiBearerAuth("access-token")
@UseGuards(JwtAuthGuard, CondoMemberGuard)
@Controller("condominiums/:condoId/tickets/:ticketId/attachments")
export class TicketAttachmentsController {
    constructor(private readonly attachments: TicketAttachmentsService) { }

    /* ── Upload ── */
    @Post()
    @ApiOperation({ summary: "Adjuntar archivo a un ticket" })
    @ApiConsumes("multipart/form-data")
    @ApiBody({ type: CreateAttachmentDto })
    @ApiCreatedResponse({ description: "Adjunto creado correctamente" })
    @ApiUnauthorizedResponse({ description: "Token inválido o sesión revocada" })
    @ApiForbiddenResponse({ description: "No eres miembro activo del condominio" })
    @UseInterceptors(
        FileInterceptor("file", {
            storage: diskStorage({
                destination: (_req, _file, cb) => {
                    cb(null, TICKETS_UPLOAD_DIR);
                },
                filename: (_req, file, cb) => {
                    const extension = extname(file.originalname);
                    const baseName = sanitizeFileName(
                        file.originalname.replace(extension, ""),
                    );
                    const uniqueName = `${Date.now()}-${baseName}${extension}`;
                    cb(null, uniqueName);
                },
            }),
            limits: { fileSize: 10 * 1024 * 1024 },
            fileFilter: (_req, file, cb) => {
                if (ALLOWED_MIMES.includes(file.mimetype)) {
                    cb(null, true);
                } else {
                    cb(
                        new BadRequestException(
                            `Tipo de archivo no permitido: ${file.mimetype}. Solo se aceptan: ${ALLOWED_MIMES.join(", ")}`,
                        ),
                        false,
                    );
                }
            },
        }),
    )
    create(
        @Param("condoId") condoId: string,
        @Param("ticketId") ticketId: string,
        @Req() req: any,
        @UploadedFile() file: Express.Multer.File,
    ) {
        if (!file) {
            throw new BadRequestException("Debes adjuntar un archivo");
        }
        return this.attachments.create(condoId, ticketId, req.user.id, file);
    }

    /* ── List ── */
    @Get()
    @ApiOperation({ summary: "Listar adjuntos del ticket" })
    @ApiOkResponse({ description: "Listado de adjuntos" })
    list(
        @Param("condoId") condoId: string,
        @Param("ticketId") ticketId: string,
    ) {
        return this.attachments.list(condoId, ticketId);
    }

    /* ── View (inline) ── */
    @Get(":attachmentId/view")
    @ApiOperation({ summary: "Abrir adjunto en el navegador" })
    async view(
        @Param("condoId") condoId: string,
        @Param("ticketId") ticketId: string,
        @Param("attachmentId") attachmentId: string,
        @Res() res: Response,
    ) {
        const att = await this.attachments.getRawById(condoId, ticketId, attachmentId);
        const filePath = join(TICKETS_UPLOAD_DIR, att.fileName);

        if (!existsSync(filePath)) {
            throw new NotFoundException("Archivo no encontrado en disco");
        }

        const contentType = att.mimeType || "application/octet-stream";
        res.setHeader("Content-Type", contentType);
        res.setHeader(
            "Content-Disposition",
            `inline; filename="${encodeURIComponent(att.originalName)}"`,
        );

        const stream = createReadStream(filePath);
        stream.pipe(res);
    }

    /* ── Download (attachment) ── */
    @Get(":attachmentId/download")
    @ApiOperation({ summary: "Descargar adjunto" })
    async download(
        @Param("condoId") condoId: string,
        @Param("ticketId") ticketId: string,
        @Param("attachmentId") attachmentId: string,
        @Res() res: Response,
    ) {
        const att = await this.attachments.getRawById(condoId, ticketId, attachmentId);
        const filePath = join(TICKETS_UPLOAD_DIR, att.fileName);

        if (!existsSync(filePath)) {
            throw new NotFoundException("Archivo no encontrado en disco");
        }

        const contentType = att.mimeType || "application/octet-stream";
        res.setHeader("Content-Type", contentType);
        res.setHeader(
            "Content-Disposition",
            `attachment; filename="${encodeURIComponent(att.originalName)}"`,
        );

        const stream = createReadStream(filePath);
        stream.pipe(res);
    }

    @Delete(":attachmentId")
    @ApiOperation({ summary: "Eliminar adjunto del ticket" })
    remove(
        @Param("condoId") condoId: string,
        @Param("ticketId") ticketId: string,
        @Param("attachmentId") attachmentId: string,
        @Req() req: any,
    ) {
        return this.attachments.remove(
            condoId,
            ticketId,
            attachmentId,
            req.user.id,
            req.condoRole,
        );
    }
}
