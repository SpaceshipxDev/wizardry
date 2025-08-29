'use client';

import { useEffect } from 'react';
import type { SheetRow } from '@/lib/db';

export default function PrintClient({ sheet, mode }: { sheet: SheetRow; mode: 'outsourcing' | 'shipping'; }) {
  useEffect(() => {
    window.print();
  }, []);

  const rows = sheet.data.masterData.filter(r => {
    const hasContent = r.productName || r.productNumber || r.material || r.quantity || r.remarks;
    return (mode === 'outsourcing' ? r.isOutsourced : true) && hasContent;
  });
  const data = mode === 'outsourcing' ? sheet.data.outsourcingData : sheet.data.shippingData;
  const title = mode === 'outsourcing' ? '外协单' : '送货单';

  return (
    <div className="p-6 text-sm">
      <h1 className="text-2xl font-bold text-center mb-2">{data.ourCompany || '杭州越侬模型科技有限公司'}</h1>
      <h2 className="text-lg font-semibold text-center mb-4">{title}</h2>

      <div className="mb-4 space-y-1">
        {mode === 'outsourcing' ? (
          <>
            <div>对方名称：{data.counterpartName}</div>
            <div>对方联系人：{data.counterpartContact}</div>
            <div>外协单号：{data.outsourceOrderNumber}</div>
            <div>寄出时间：{data.dispatchDate}</div>
            <div>寄回时间：{data.returnDate}</div>
            <div>订单金额：{data.orderAmount}</div>
            <div>我方：{data.ourCompany}</div>
            <div>我方收件地址：{data.ourAddress}</div>
            <div>我方联系人：{data.ourContact}</div>
            <div>备注：{data.remarks}</div>
          </>
        ) : (
          <>
            <div>客户名称：{data.customerName}</div>
            <div>客户联系人：{data.customerContact}</div>
            <div>联系方式：{data.contactPhone}</div>
            <div>生产单号：{data.productionOrderNumber}</div>
            <div>合同编号：{data.contractNumber}</div>
            <div>送货日期：{data.deliveryDate}</div>
            <div>货品总数：{data.totalProductCount}</div>
            <div>我方：{data.ourCompany}</div>
            <div>我方联系人：{data.ourContact}</div>
            <div>备注：{data.remarks}</div>
          </>
        )}
      </div>

      <table className="w-full border border-black border-collapse">
        <thead>
          <tr>
            <th className="border p-1">序号</th>
            <th className="border p-1">产品编号</th>
            <th className="border p-1">产品名称</th>
            <th className="border p-1">材料</th>
            <th className="border p-1">{mode === 'outsourcing' ? '数量' : '交货数量'}</th>
            <th className="border p-1">备注</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i}>
              <td className="border p-1 text-center">{i + 1}</td>
              <td className="border p-1">{r.productNumber}</td>
              <td className="border p-1">{r.productName}</td>
              <td className="border p-1">{r.material}</td>
              <td className="border p-1">{r.quantity}</td>
              <td className="border p-1">{r.remarks}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
