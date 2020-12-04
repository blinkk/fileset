import {app} from '../server';

interface ServeOptions {
  bucket: string;
  site: string;
  ref: string;
  branch: string;
  redirect: string;
  config: string;
}

export class ServeCommand {
  constructor(private readonly options: ServeOptions) {
    this.options = options;
  }

  run() {
    const PORT = process.env.PORT || 8080;
    app.listen(PORT, () => {
      console.log(`App listening on port ${PORT}`);
      console.log('Press Ctrl+C to quit.');
    });
  }
}
