import { getDaxtraClient } from './daxtraClientFactory.js';

export class ConversionService {
  private daxtraClient = getDaxtraClient();

  async convertToHtml(fileBuffer: Buffer, highQuality: boolean, filename: string): Promise<string> {
    return await this.daxtraClient.convertToHtml(fileBuffer, highQuality, filename);
  }

  parseHighQualityOption(body: any, query: any): boolean {
    return body.high_quality === 'true' || query.high_quality === 'true';
  }
}
