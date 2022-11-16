#!/usr/bin/env node
import { Command } from "commander";

const program = new Command();

program.option("-o, --outdir <outdir>", "the directory to save the images to");

program.parse(process.argv);

(async function main(options) {
  console.log({ options });
})(program.opts());
