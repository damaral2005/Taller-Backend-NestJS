import { Controller, Get } from '@nestjs/common';
import {
  ApiOkResponse,
  ApiOperation,
  ApiProperty,
  ApiTags,
} from '@nestjs/swagger';

export class HealthResponse {
  @ApiProperty({ enum: ['ok'], example: 'ok' })
  status!: 'ok';
}

@ApiTags('health')
@Controller('health')
export class HealthController {
  @Get()
  @ApiOperation({
    summary: 'Disponibilidad del proceso (público)',
    description: 'Indica que el proceso HTTP responde; no comprueba la BD.',
  })
  @ApiOkResponse({ type: HealthResponse })
  getHealth(): { status: 'ok' } {
    return { status: 'ok' };
  }
}
