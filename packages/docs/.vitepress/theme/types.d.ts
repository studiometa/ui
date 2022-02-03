export interface File {
  label: string;
  lang: string;
  content: string;
}

export interface Story {
  src: string;
  name?: string;
  files: File[];
}
