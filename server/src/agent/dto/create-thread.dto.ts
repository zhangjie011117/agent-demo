import { IsString, IsNotEmpty, IsNumberString } from 'class-validator';

export class CreateThreadDto {
  @IsString()
  @IsNotEmpty()
  @IsNumberString()
  agentId: string;

  @IsString()
  @IsNotEmpty()
  userId: string;
}
