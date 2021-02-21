import {Component, h} from 'preact';

import {Link} from 'preact-router/match';
import {Page} from './page';
import {rpc} from '../utils/rpc';

interface BuildPageProps {
  matches?: any; // TODO: This isn't right; props.matches required.
  path: string;
  siteId?: string;
  ref?: string;
}

interface BuildPageState {
  currentPath: string;
  siteId: string;
  ref: string;
  manifest: any;
}

export class BuildPage extends Page<BuildPageProps, BuildPageState> {
  constructor(props: BuildPageProps) {
    super(props);
    this.state = {
      currentPath: '',
      siteId: props.siteId,
      ref: props.matches.ref,
      manifest: null,
    };
  }

  async componentDidMount() {
    try {
      const resp: any = await rpc('manifest.get', {
        site: this.state.siteId,
        refOrBranch: this.state.ref,
      });
      this.setState({manifest: resp.manifest});
      console.log(this.state.manifest, resp.manifest);
    } catch (err) {
      console.error(err);
    }
  }

  filterPaths(paths: Record<string, string>) {
    return Object.keys(paths)
      .sort()
      .filter(path => {
        return !path.startsWith('/_') && !path.startsWith('/.');
      });
  }

  cleanPath(path: string) {
    return path.replace(/index.html$/, '');
  }

  createServingUrl(path: string) {
    return path;
  }

  render() {
    return (
      <div class="BuildPage">
        <div class="BuildPage__title">
          Site:&nbsp;
          <Link href={`/fileset/sites/${this.state.siteId}`}>
            {this.state.siteId}
          </Link>
          &nbsp;@&nbsp;
          <Link href={`/fileset/sites/${this.state.siteId}/${this.state.ref}`}>
            {this.state.ref}
          </Link>
        </div>
        <div class="BuildPage__content">
          <div class="BuildPage__content__table">
            <div class="BuildPage__content__table__title">Files</div>
            <table>
              <thead>
                <tr>
                  <th>Path</th>
                </tr>
              </thead>
              <tbody>
                {this.state.manifest && this.state.manifest.paths ? (
                  this.filterPaths(this.state.manifest.paths).map((row, i) => (
                    <tr>
                      <td>
                        <a href={this.createServingUrl(this.cleanPath(row))}>
                          {this.cleanPath(row)}
                        </a>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td>Loading...</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <div class="BuildPage__content__table">
            <div class="BuildPage__content__table__title">Redirects</div>
            <div>{this.state.manifest && this.state.manifest.redirects}</div>
            <table>
              <thead>
                <tr>
                  <td>From</td>
                  <td>To</td>
                  <td>Permanent</td>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Master</td>
                  <td>3259ae</td>
                  <td>2020/10/19 05:12</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }
}
