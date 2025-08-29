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
  isOutsourced?: boolean;
};

export type CellAddress = { row: number; col: number };
