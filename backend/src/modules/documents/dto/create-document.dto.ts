import { IsNotEmpty, IsOptional, IsString, MaxLength } from "class-validator";

export class CreateDocumentDto {
    @IsString()
    @IsNotEmpty()
    @MaxLength(150)
    title: string;

    @IsOptional()
    @IsString()
    @MaxLength(1000)
    description?: string;

    @IsString()
    @IsNotEmpty()
    @MaxLength(50)
    category: string;
}