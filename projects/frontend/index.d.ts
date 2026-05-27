declare module "*.svg" {
  import type * as React from "react";

  const content: string;
  export const ReactComponent: React.FunctionComponent<
    React.SVGProps<SVGSVGElement>
  >;
  export default content;
}
