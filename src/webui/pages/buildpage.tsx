import {Component, h} from 'preact';

import {Link} from 'preact-router/match';
import {Loading} from '../components/loading';
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
  loading: boolean;
  ref: string;
  manifest: any;
}

export class BuildPage extends Page<BuildPageProps, BuildPageState> {
  constructor(props: BuildPageProps) {
    super(props);
    this.state = {
      currentPath: '',
      siteId: props.siteId,
      loading: false,
      ref: props.matches.ref,
      manifest: null,
    };
  }

  async componentDidMount() {
    this.setState({loading: true});
    try {
      const resp: any = await rpc('manifest.get', {
        site: this.state.siteId,
        refOrBranch: this.state.ref,
      });
      this.setState({
        loading: false,
        manifest: resp.manifest,
      });
      console.log(this.state.manifest, resp.manifest);
    } catch (err) {
      this.setState({loading: false});
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

  renderLoading() {
    return <Loading />;
  }

  renderPathsTable() {
    return (
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
                <td>No files uploaded.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    );
  }

  renderRedirectsTable() {
    return (
      <div class="BuildPage__content__table">
        <div class="BuildPage__content__table__title">Redirects</div>
        {this.state.manifest &&
        this.state.manifest.redirects &&
        this.state.manifest.redirects.length ? (
          <table>
            <thead>
              <tr>
                <th>Path</th>
                <th>To</th>
                <th>Permanent</th>
              </tr>
            </thead>
            <tbody>
              {this.state.manifest.redirects.map((redirect: any) => (
                <tr>
                  <td>
                    <a href={this.createServingUrl(redirect.from)}>
                      {redirect.from}
                    </a>
                  </td>
                  <td>{redirect.to}</td>
                  <td>{redirect.permanent}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div class="BuildPage__content__table__empty">
            No redirects have been configured.
          </div>
        )}
      </div>
    );
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
          {this.state.loading ? this.renderLoading() : this.renderPathsTable()}
          {this.state.loading ? '' : this.renderRedirectsTable()}
        </div>
      </div>
    );
  }
}
