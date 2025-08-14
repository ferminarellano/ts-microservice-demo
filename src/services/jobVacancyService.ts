import { getDaxtraClient } from './daxtraClientFactory.js';

export class JobVacancyService {
  private daxtraClient = getDaxtraClient();

  async parseJobOrder(fileBuffer: Buffer, filename: string) {
    return await this.daxtraClient.parseJobOrder(fileBuffer, filename);
  }
}
