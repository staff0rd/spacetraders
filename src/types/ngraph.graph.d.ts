export default function createGraph(): Graph;

declare class Graph {
  getNode(nodeId: string): Node;
  addNode(nodeId: string, data: any): Node;
  addLink(fromId: string, toId: string, data?: any): Link;
  getLink(fromNodeId: string, toNodeId: string): Link;
  removeLink(link: Link): boolean;
  removeNode(nodeId: string): boolean;
  getLinksCount(): number;
  forEachLink(func: (link: Link) => void): void;
  forEachNode(func: (node: Node) => void): void;
}

declare interface INode {
  id: string;
  data: any;
}

declare class Node implements INode {
  id: string;
  data: any;
  links: Link[];
}

declare interface ILink {
  fromId: string;
  toId: string;
  data: any;
}

declare class Link implements ILink {
  fromId: string;
  toId: string;
  id: string;
  data: any;
}
