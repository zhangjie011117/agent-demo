import { IsString, IsNotEmpty } from 'class-validator';

export class GetThreadsQueryDto {
  @IsString()
  @IsNotEmpty()
  userId: string;
}
