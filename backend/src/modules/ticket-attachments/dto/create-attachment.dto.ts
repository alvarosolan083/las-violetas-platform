import { ApiProperty } from "@nestjs/swagger";

export class CreateAttachmentDto {
    @ApiProperty({
        type: "string",
        format: "binary",
        description: "Archivo adjunto (imagen o PDF, máx. 10 MB)",
    })
    file: Express.Multer.File;
}
