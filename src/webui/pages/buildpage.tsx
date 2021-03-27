import {Component, h} from 'preact';

import {Link} from 'preact-router/match';
import {Loading} from '../components/loading';
import {Page} from './page';
import {createStagingLink} from '../utils/links';
import {prettyDate} from '../utils/formatters';
import {rpc} from '../utils/rpc';

interface BuildPageProps {
  matches?: any; // TODO: This isn't right; props.matches required.
  path: string;
  siteId?: string;
  ref?: string;
  tab?: string;
}

interface BuildPageState {
  currentPath: string;
  siteId: string;
  loading: boolean;
  ref: string;
  manifest: any;
  tab?: string;
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
      tab: props.matches.tab,
    };
    console.log(this);
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
    } catch (err) {
      this.setState({loading: false});
      console.error(err);
    }
  }

  async componentWillReceiveProps(props: BuildPageProps) {
    this.setState({tab: props.tab});
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
    return createStagingLink(
      window.location.href,
      this.state.manifest.site,
      this.state.manifest.branch,
      this.state.manifest.ref,
      path
    );
  }

  renderLoading() {
    return <Loading />;
  }

  renderPathsTable() {
    return (
      <div class="BuildPage__content__table">
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

  renderGitData() {
    return (
      <div>
        {this.state.manifest && this.state.manifest.commit ? (
          <div class="BuildPage__content__gitData">
            <div class="BuildPage__content__gitData__primary">
              <span
                class="BuildPage__content__gitData__primary__author"
                title="{this.state.manifest.commit.author.email}"
              >
                {this.state.manifest.commit.author.name}
              </span>
              <span class="BuildPage__content__gitData__primary__message">
                {this.state.manifest.commit.message}
              </span>
            </div>
            <div class="BuildPage__content__gitData__secondary">
              <span class="BuildPage__content__gitData__secondary__shortSha">
                <code>{this.state.manifest.ref.slice(0, 7)}</code>
              </span>
              &nbsp;on&nbsp;
              <span class="BuildPage__content__gitData__secondary__modified">
                {prettyDate(this.state.manifest.modified)}
              </span>
            </div>
          </div>
        ) : (
          ''
        )}
      </div>
    );
  }

  renderTabSet() {
    return (
      <div class="BuildPage__tabset">
        <div class="BuildPage__tabset__bar">
          <Link
            className={`BuildPage__tabset__bar__tab ${
              this.state.tab === undefined
                ? 'BuildPage__tabset__bar__tab--active'
                : ''
            }`}
            href={this.state.currentPath}
          >
            <span class="material-icons-outlined">insert_drive_file</span>
            Files (
            {this.state.manifest
              ? Object.keys(this.state.manifest.paths).length
              : '0'}
            )
          </Link>
          <Link
            className={`BuildPage__tabset__bar__tab ${
              this.state.tab === 'redirects'
                ? 'BuildPage__tabset__bar__tab--active'
                : ''
            }`}
            href={`${this.state.currentPath}?tab=redirects`}
          >
            <span class="material-icons-outlined">double_arrow</span>
            Redirects (
            {this.state.manifest ? this.state.manifest.redirects.length : '0'})
          </Link>
        </div>
        <div>
          {this.state.tab === undefined ? this.renderPathsTable() : ''}
          {this.state.tab === 'redirects' ? this.renderRedirectsTable() : ''}
        </div>
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
          <Link
            href={`/fileset/sites/${this.state.siteId}/${encodeURIComponent(
              this.state.ref
            )}`}
          >
            {this.state.ref}
          </Link>
        </div>
        <div class="BuildPage__content">
          {this.state.loading ? '' : this.renderGitData()}
          {this.state.loading ? this.renderLoading() : this.renderTabSet()}
        </div>
      </div>
    );
  }
}
