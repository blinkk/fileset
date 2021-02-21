import {Component, h} from 'preact';

import {Page} from './page';

interface SitePageProps {
  path: string;
  siteId?: string;
}

interface SitePageState {
  currentPath: string;
  siteId: string;
}

export class SitePage extends Page<SitePageProps, SitePageState> {
  constructor(props: SitePageProps) {
    super(props);
    this.state = {
      currentPath: '',
      siteId: props.siteId,
    };
  }
  render() {
    return (
      <div class="SitePage">
        <div class="SitePage__title">Site: {this.state.siteId}</div>
        <div class="SitePage__content">Result</div>
      </div>
    );
  }
}
