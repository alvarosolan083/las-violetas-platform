import {
    Body,
    Controller,
    Delete,
    Get,
    NotFoundException,
    Param,
    Post,
    Query,
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
import { ApiBearerAuth, ApiConsumes, ApiOperation, ApiTags } from "@nestjs/swagger";
import { CondoMemberGuard } from "../condo/condo-member.guard";
import { CondoRoles } from "../condo/condo-roles.decorator";
import { CondoRolesGuard } from "../condo/condo-roles.guard";
import { DocumentsService } from "./documents.service";
import { CreateDocumentDto } from "./dto/create-document.dto";

function sanitizeFileName(name: string) {
    return name
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-zA-Z0-9-_]/g, "_")
        .toLowerCase();
}

/* ── Directorio de subida (absoluto, basado en process.cwd()) ── */
const DOCUMENTS_UPLOAD_DIR = join(process.cwd(), "uploads", "documents");

if (!existsSync(DOCUMENTS_UPLOAD_DIR)) {
    mkdirSync(DOCUMENTS_UPLOAD_DIR, { recursive: true });
}

@ApiTags("Documents")
@ApiBearerAuth("access-token")
@UseGuards(CondoMemberGuard)
@Controller("condominiums/:condoId/documents")
export class DocumentsController {
    constructor(private readonly service: DocumentsService) { }

    /* ── Upload ── */
    @Post()
    @UseGuards(CondoRolesGuard)
    @CondoRoles("ADMINISTRADOR", "COMITE")
    @ApiOperation({ summary: "Upload document (ADMINISTRADOR/COMITE)" })
    @ApiConsumes("multipart/form-data")
    @UseInterceptors(
        FileInterceptor("file", {
            storage: diskStorage({
                destination: (_req, _file, cb) => {
                    cb(null, DOCUMENTS_UPLOAD_DIR);
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
            limits: {
                fileSize: 10 * 1024 * 1024,
            },
        }),
    )
    create(
        @Param("condoId") condoId: string,
        @Req() req: any,
        @Body() dto: CreateDocumentDto,
        @UploadedFile() file: Express.Multer.File,
    ) {
        return this.service.createForCondo(condoId, req.user.id, dto, file);
    }

    /* ── List ── */
    @Get()
    @ApiOperation({ summary: "List documents" })
    list(
        @Param("condoId") condoId: string,
        @Query("category") category?: string,
        @Query("search") search?: string,
        @Query("page") page?: string,
        @Query("pageSize") pageSize?: string,
    ) {
        return this.service.listByCondo(condoId, {
            category,
            search,
            page: page ? Number(page) : 1,
            pageSize: pageSize ? Number(pageSize) : 10,
        });
    }

    /* ── Get by id (metadata JSON) ── */
    @Get(":documentId")
    @ApiOperation({ summary: "Get document by id" })
    getById(
        @Param("condoId") condoId: string,
        @Param("documentId") documentId: string,
    ) {
        return this.service.getById(condoId, documentId);
    }

    /* ── View (inline en el navegador) ── */
    @Get(":documentId/view")
    @ApiOperation({ summary: "Open document in browser" })
    async view(
        @Param("condoId") condoId: string,
        @Param("documentId") documentId: string,
        @Res() res: Response,
    ) {
        const doc = await this.service.getRawById(condoId, documentId);
        const filePath = join(DOCUMENTS_UPLOAD_DIR, doc.fileName);

        if (!existsSync(filePath)) {
            throw new NotFoundException("Archivo no encontrado en disco");
        }

        const contentType = doc.mimeType || "application/octet-stream";

        res.setHeader("Content-Type", contentType);
        res.setHeader(
            "Content-Disposition",
            `inline; filename="${encodeURIComponent(doc.originalName)}"`,
        );

        const stream = createReadStream(filePath);
        stream.pipe(res);
    }

    /* ── Download (attachment) ── */
    @Get(":documentId/download")
    @ApiOperation({ summary: "Download document" })
    async download(
        @Param("condoId") condoId: string,
        @Param("documentId") documentId: string,
        @Res() res: Response,
    ) {
        const doc = await this.service.getRawById(condoId, documentId);
        const filePath = join(DOCUMENTS_UPLOAD_DIR, doc.fileName);

        if (!existsSync(filePath)) {
            throw new NotFoundException("Archivo no encontrado en disco");
        }

        const contentType = doc.mimeType || "application/octet-stream";

        res.setHeader("Content-Type", contentType);
        res.setHeader(
            "Content-Disposition",
            `attachment; filename="${encodeURIComponent(doc.originalName)}"`,
        );

        const stream = createReadStream(filePath);
        stream.pipe(res);
    }

    /* ── Delete ── */
    @Delete(":documentId")
    @UseGuards(CondoRolesGuard)
    @CondoRoles("ADMINISTRADOR", "COMITE")
    @ApiOperation({ summary: "Delete document (ADMINISTRADOR/COMITE)" })
    remove(
        @Param("condoId") condoId: string,
        @Param("documentId") documentId: string,
    ) {
        return this.service.remove(condoId, documentId);
    }
}