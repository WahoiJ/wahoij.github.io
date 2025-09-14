declare module 'react-image-gallery' {
  import * as React from 'react';
  interface Image {
    original: string;
    thumbnail?: string;
    description?: string;
    originalClass?: string;
    thumbnailClass?: string;
    renderItem?: () => React.ReactNode;
    renderThumbInner?: () => React.ReactNode;
    originalAlt?: string;
    thumbnailAlt?: string;
    embedUrl?: string;
    renderCustomControls?: () => React.ReactNode;
    bulletClass?: string;
    originalTitle?: string;
    thumbnailTitle?: string;
  }
  interface Props {
    items: Image[];
    [key: string]: unknown;
  }
  export default class ImageGallery extends React.Component<Props> {}
}