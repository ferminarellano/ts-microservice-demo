import { extractCompetencies } from '../index.js';
import { getDaxtraClient } from './daxtraClientFactory.js';

export class ResumeParsingService {
  private daxtraClient = getDaxtraClient();

  async parseFullResume(fileBuffer: Buffer, filename: string) {
    const result = await this.daxtraClient.parseFullResume(fileBuffer, filename);
    const competencies = extractCompetencies(result);
    
    return {
      profile: result,
      competencies
    };
  }

  async parsePersonalThenFull(fileBuffer: Buffer, filename: string) {
    const result = await this.daxtraClient.parsePersonalThenFull(fileBuffer, filename);
    const competencies = extractCompetencies(result.full);
    
    return {
      personal: result.personal,
      full: result.full,
      competencies
    };
  }
}
