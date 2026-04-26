declare module "bpmn-moddle" {
  interface FromXMLResult {
    rootElement: any;
    warnings: any[];
  }

  export class BpmnModdle {
    fromXML(xml: string): Promise<FromXMLResult>;
  }
}
