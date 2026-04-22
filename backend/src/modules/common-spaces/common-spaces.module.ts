import { Module } from "@nestjs/common";
import { CommonSpacesController } from "./common-spaces.controller";
import { CommonSpacesService } from "./common-spaces.service";

@Module({
    controllers: [CommonSpacesController],
    providers: [CommonSpacesService],
})
export class CommonSpacesModule { }