'use client';

import { useEffect, useRef } from 'react';
import type { SheetRow } from '@/lib/db';

export default function PrintClient({ sheet, mode }: { sheet: SheetRow; mode: 'outsourcing' | 'shipping'; }) {
  const printedRef = useRef(false);
  useEffect(() => {
    if (printedRef.current) return;
    printedRef.current = true;

    const closeSelf = () => {
      try {
        // Give the browser a beat to settle focus first
        setTimeout(() => window.close(), 0);
      } catch {}
    };

    const afterPrint = () => closeSelf();
    const media = window.matchMedia('print');
    const onMedia = (e: MediaQueryListEvent) => { if (!e.matches) closeSelf(); };

    window.addEventListener('afterprint', afterPrint);
    try { media.addEventListener('change', onMedia); } catch { /* older browsers */ }

    // Slight delay helps Safari/Chrome stabilize before printing
    const id = setTimeout(() => { try { window.print(); } catch {} }, 50);

    return () => {
      clearTimeout(id);
      window.removeEventListener('afterprint', afterPrint);
      try { media.removeEventListener('change', onMedia); } catch {}
    };
  }, []);

  const rows = sheet.data.masterData.filter(r => {
    const hasContent = r.productName || r.productNumber || r.material || r.quantity || r.remarks;
    return (mode === 'outsourcing' ? r.isOutsourced : true) && hasContent;
  });
  const title = mode === 'outsourcing' ? '外协单' : '送货单';

  return (
    <div className="p-6 text-sm">
      <h1 className="text-2xl font-bold text-center mb-2">{(mode === 'outsourcing' ? sheet.data.outsourcingData.ourCompany : sheet.data.shippingData.ourCompany) || '杭州越侬模型科技有限公司'}</h1>
      <h2 className="text-lg font-semibold text-center mb-4">{title}</h2>

      <div className="mb-4 space-y-1">
        {mode === 'outsourcing' ? (
          <>
            <div>对方名称：{sheet.data.outsourcingData.counterpartName}</div>
            <div>对方联系人：{sheet.data.outsourcingData.counterpartContact}</div>
            <div>外协单号：{sheet.data.outsourcingData.outsourceOrderNumber}</div>
            <div>寄出时间：{sheet.data.outsourcingData.dispatchDate}</div>
            <div>寄回时间：{sheet.data.outsourcingData.returnDate}</div>
            <div>订单金额：{sheet.data.outsourcingData.orderAmount}</div>
            <div>我方：{sheet.data.outsourcingData.ourCompany}</div>
            <div>我方收件地址：{sheet.data.outsourcingData.ourAddress}</div>
            <div>我方联系人：{sheet.data.outsourcingData.ourContact}</div>
            <div>备注：{sheet.data.outsourcingData.remarks}</div>
          </>
        ) : (
          <>
            <div>客户名称：{sheet.data.shippingData.customerName}</div>
            <div>客户联系人：{sheet.data.shippingData.customerContact}</div>
            <div>联系方式：{sheet.data.shippingData.contactPhone}</div>
            <div>生产单号：{sheet.data.shippingData.productionOrderNumber}</div>
            <div>合同编号：{sheet.data.shippingData.contractNumber}</div>
            <div>送货日期：{sheet.data.shippingData.deliveryDate}</div>
            <div>货品总数：{sheet.data.shippingData.totalProductCount}</div>
            <div>我方：{sheet.data.shippingData.ourCompany}</div>
            <div>我方联系人：{sheet.data.shippingData.ourContact}</div>
            <div>备注：{sheet.data.shippingData.remarks}</div>
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
