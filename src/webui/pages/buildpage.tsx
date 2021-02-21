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
      const manifest = await rpc('manifest.get', {
        site: this.state.siteId,
        refOrBranch: this.state.ref,
      });
      this.setState({manifest: manifest});
    } catch (err) {
      console.error(err);
    }
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
                  <td>Path</td>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>/about/</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div class="BuildPage__content__table">
            <div class="BuildPage__content__table__title">Redirects</div>
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
