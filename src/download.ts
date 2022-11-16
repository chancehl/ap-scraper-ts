import Axios from "axios";
import path from "path";
import fs from "fs";

export async function download(url: string, dir: string): Promise<void> {
  const [_, name] = url.split("https://i.redd.it/");

  const location = path.resolve(dir, name);

  const writer = fs.createWriteStream(location);

  const response = await Axios({
    url,
    method: "GET",
    responseType: "stream",
  });

  response.data.pipe(writer);

  return new Promise((resolve, reject) => {
    writer.on("finish", resolve);
    writer.on("error", reject);
  });
}
