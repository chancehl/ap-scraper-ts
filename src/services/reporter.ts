import fs from "fs";

type ReportServiceConstructorArgs = {
  outdir?: string;
};

export type ImageMetadata = {
  title: string;
  outdir: string;
  resolution?: { x: number; y: number };
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
      JSON.stringify(results),
      { flag: "wx" }
    );
  }
}
