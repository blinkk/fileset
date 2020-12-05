import {getGitData} from '../gitdata';
import {createApp} from '../server';

interface ServeOptions {
  site: string;
  ref: string;
  branch: string;
}

export class ServeCommand {
  constructor(private readonly options: ServeOptions) {
    this.options = options;
  }

  run() {
    const app = createApp(
      this.options.site || 'default',
      this.options.ref || '',
      this.options.branch || ''
    );
    const PORT = process.env.PORT || 8080;
    app.listen(PORT, () => {
      console.log(`App listening on port ${PORT}`);
      console.log('Press Ctrl+C to quit.');
    });
  }
}
