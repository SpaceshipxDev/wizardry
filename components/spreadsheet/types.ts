// @components/spreadsheet/types.ts
import { ReactNode } from 'react';

export type CellValue = string | number | boolean | ReactNode;

export type MasterDataRow = {
  productImage: CellValue;
  productNumber: CellValue;
  productName: CellValue;
  material: CellValue;
  surfaceFinish: CellValue;
  quantity: CellValue;
  remarks: CellValue;
  // Quotation-specific
  unitPrice?: CellValue; // 单价
  totalPrice?: CellValue; // 总价
  // Production-specific
  processingMethod?: CellValue; // 加工方式
  processRequirements?: CellValue; // 工艺要求
  isOutsourced?: boolean;
};

export type CellAddress = { row: number; col: number };
