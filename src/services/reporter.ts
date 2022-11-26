import fs from "fs";

import { ImageMetadata } from "../types";

type ReportServiceConstructorArgs = {
  outdir?: string;
};

export class ReportService {
  private outdir: string;

  constructor({ outdir }: ReportServiceConstructorArgs) {
    this.outdir = outdir ?? "./report";
  }

  async writeReportToDisk(results: ImageMetadata[]): Promise<void> {
    // if outdir doesn't exist, create it
    fs.mkdirSync(this.outdir, { recursive: true });

    // write to file
    fs.writeFileSync(
      `${this.outdir}/${new Date().toISOString()}-report.json`,
      JSON.stringify(results, null, 4),
      { flag: "wx" }
    );
  }
}
