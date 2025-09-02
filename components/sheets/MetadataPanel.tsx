"use client";

import { useState } from 'react';
import { ChevronDown, MessageSquare, Pencil } from 'lucide-react';
import CommentPopup from '@/components/sheets/CommentPopup';

type ComprehensiveData = { salesOrderNumber: string; customerName: string; contactPerson: string; dueDate: string };
type OutsourcingOrderData = {
  counterpartName: string;
  counterpartContact: string;
  outsourceOrderNumber: string;
  dispatchDate: string;
  returnDate: string;
  orderAmount: string;
  ourCompany: string;
  ourAddress: string;
  ourContact: string;
  remarks: string;
};
type ShippingOrderData = {
  customerName: string;
  customerContact: string;
  contactPhone: string;
  productionOrderNumber: string;
  contractNumber: string;
  deliveryDate: string;
  totalProductCount: string;
  ourCompany: string;
  ourContact: string;
  remarks: string;
};

export default function MetadataPanel({
  activeSheet,
  comprehensiveData,
  setComprehensiveData,
  outsourcingData,
  setOutsourcingData,
  shippingData,
  setShippingData,
  comments,
  currentStage,
  isCommentPopupVisible,
  onOpenCommentPopup,
  onCloseCommentPopup,
  onAddComment,
  onSelectStage,
  onEditStage,
  showStagePicker,
  stageValue,
  stageOptions,
}: {
  activeSheet: string;
  comprehensiveData: ComprehensiveData;
  setComprehensiveData: (d: ComprehensiveData) => void;
  outsourcingData: OutsourcingOrderData;
  setOutsourcingData: (d: OutsourcingOrderData) => void;
  shippingData: ShippingOrderData;
  setShippingData: (d: ShippingOrderData) => void;
  comments: string[];
  currentStage: string | null;
  isCommentPopupVisible: boolean;
  onOpenCommentPopup: () => void;
  onCloseCommentPopup: () => void;
  onAddComment: (comment: string) => void;
  onSelectStage: (stage: string) => void;
  onEditStage: () => void;
  showStagePicker: boolean;
  stageValue: string | null;
  stageOptions: string[];
}) {
  const [expanded, setExpanded] = useState(false);
  const hasDetails = activeSheet !== '综合';

  // Minimal UI: use discrete stepper dots instead of percentages/gradients

  return (
    <div className="border-b">
      <div className="px-4 py-3 bg-gray-50/75 flex items-start gap-3">
        {hasDetails && (
          <button
            onClick={() => setExpanded((v) => !v)}
            className={`mt-1 h-7 w-7 rounded-full flex items-center justify-center text-gray-600 hover:bg-gray-200 transition ${expanded ? 'rotate-180' : ''}`}
            title={expanded ? '收起详细' : '展开详细'}
          >
            <ChevronDown size={18} />
          </button>
        )}
        <div className="flex-1 flex flex-col gap-2">
          <div className="grid grid-cols-4 gap-x-6 gap-y-3">
            <MetaField isGlobal label="销售单号" value={comprehensiveData.salesOrderNumber} onChange={v => setComprehensiveData({ ...comprehensiveData, salesOrderNumber: v })} />
            <MetaField isGlobal label="客户名称" value={comprehensiveData.customerName} onChange={v => setComprehensiveData({ ...comprehensiveData, customerName: v })} />
            <MetaField isGlobal label="联系人" value={comprehensiveData.contactPerson} onChange={v => setComprehensiveData({ ...comprehensiveData, contactPerson: v })} />
            <MetaDateField isGlobal label="交期" value={comprehensiveData.dueDate} onChange={v => setComprehensiveData({ ...comprehensiveData, dueDate: v })} />
          </div>

          <div className="flex items-center gap-3 pt-1">
            <div className="relative">
              <button
                onClick={onOpenCommentPopup}
                className="p-1.5 rounded-full hover:bg-gray-200 text-gray-600 transition-colors"
                title="添加评论"
              >
                <MessageSquare size={18} />
              </button>
              {isCommentPopupVisible && (
                <CommentPopup
                  onClose={onCloseCommentPopup}
                  onComment={onAddComment}
                  onSelectStage={showStagePicker ? onSelectStage : undefined}
                  showStagePicker={showStagePicker}
                  stageValue={stageValue || null}
                  stageOptions={stageOptions}
                />
              )}
            </div>
            {currentStage && (
              <div className="flex items-center gap-3">
                <span className="text-xs text-gray-600">{currentStage}</span>
                <div className="flex items-center gap-1.5" aria-label="阶段进度">
                  {stageOptions.map((s, idx) => {
                    const currentIdx = stageOptions.indexOf(currentStage);
                    const filled = idx <= currentIdx;
                    return (
                      <span
                        key={s}
                        className={`w-1.5 h-1.5 rounded-full ${filled ? 'bg-zinc-900' : 'bg-zinc-300'}`}
                        title={s}
                        aria-hidden="true"
                      />
                    );
                  })}
                </div>
                <button
                  onClick={onEditStage}
                  className="p-1 text-zinc-500 hover:text-zinc-900"
                  title="编辑阶段"
                >
                  <Pencil size={14} />
                </button>
              </div>
            )}
            {comments.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {comments.map((c, i) => (
                  <span
                 key={i}
                    className="max-w-xs truncate text-sm text-blue-700 italic"
                    title={String(c)}
                  >
                    &ldquo;{String(c)}&rdquo;
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {hasDetails && expanded && (
        <div className="px-6 py-4 bg-white">
          {activeSheet === '外协' && (
            <div className="grid grid-cols-1 gap-y-3">
              <MetaField label="对方名称" value={outsourcingData.counterpartName} onChange={v => setOutsourcingData({ ...outsourcingData, counterpartName: v })} />
              <MetaField label="对方联系人" value={outsourcingData.counterpartContact} onChange={v => setOutsourcingData({ ...outsourcingData, counterpartContact: v })} />
              <MetaField label="外协单号" value={outsourcingData.outsourceOrderNumber} onChange={v => setOutsourcingData({ ...outsourcingData, outsourceOrderNumber: v })} />
              <MetaDateField label="寄出时间" value={outsourcingData.dispatchDate} onChange={v => setOutsourcingData({ ...outsourcingData, dispatchDate: v })} />
              <MetaDateField label="寄回时间" value={outsourcingData.returnDate} onChange={v => setOutsourcingData({ ...outsourcingData, returnDate: v })} />
              <MetaField label="订单金额" value={outsourcingData.orderAmount} onChange={v => setOutsourcingData({ ...outsourcingData, orderAmount: v })} />
              <MetaField label="我方" value={outsourcingData.ourCompany} onChange={v => setOutsourcingData({ ...outsourcingData, ourCompany: v })} />
              <MetaField label="我方收件地址" value={outsourcingData.ourAddress} onChange={v => setOutsourcingData({ ...outsourcingData, ourAddress: v })} />
              <MetaField label="我方联系人" value={outsourcingData.ourContact} onChange={v => setOutsourcingData({ ...outsourcingData, ourContact: v })} />
              <MetaField label="备注" value={outsourcingData.remarks} onChange={v => setOutsourcingData({ ...outsourcingData, remarks: v })} />
            </div>
          )}
          {activeSheet === '出货' && (
            <div className="grid grid-cols-1 gap-y-3">
              <MetaField label="客户名称" value={shippingData.customerName} onChange={v => setShippingData({ ...shippingData, customerName: v })} />
              <MetaField label="客户联系人" value={shippingData.customerContact} onChange={v => setShippingData({ ...shippingData, customerContact: v })} />
              <MetaField label="联系方式" value={shippingData.contactPhone} onChange={v => setShippingData({ ...shippingData, contactPhone: v })} />
              <MetaField label="生产单号" value={shippingData.productionOrderNumber} onChange={v => setShippingData({ ...shippingData, productionOrderNumber: v })} />
              <MetaField label="合同编号" value={shippingData.contractNumber} onChange={v => setShippingData({ ...shippingData, contractNumber: v })} />
              <MetaDateField label="送货日期" value={shippingData.deliveryDate} onChange={v => setShippingData({ ...shippingData, deliveryDate: v })} />
              <MetaField label="货品总数" value={shippingData.totalProductCount} onChange={v => setShippingData({ ...shippingData, totalProductCount: v })} />
              <MetaField label="我方" value={shippingData.ourCompany} onChange={v => setShippingData({ ...shippingData, ourCompany: v })} />
              <MetaField label="我方联系人" value={shippingData.ourContact} onChange={v => setShippingData({ ...shippingData, ourContact: v })} />
              <MetaField label="备注" value={shippingData.remarks} onChange={v => setShippingData({ ...shippingData, remarks: v })} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function MetaField({ label, value, onChange, isGlobal = false, containerClassName = "" }: { label: string; value: string; onChange: (v: string) => void; isGlobal?: boolean; containerClassName?: string }) {
  return (
    <div className={`flex items-center gap-2 ${containerClassName}`}>
      <label className="text-xs font-medium text-gray-500 whitespace-nowrap">
        <span className="inline-flex items-center gap-1.5" title={isGlobal ? '全局字段' : undefined}>
          {isGlobal && <span className="global-indicator" aria-label="全局字段" />}
          {label}:
        </span>
      </label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => e.stopPropagation()}
        className="w-full bg-transparent text-gray-900 text-sm p-1 rounded-md hover:bg-gray-200 focus:bg-white focus:ring-1 focus:ring-blue-500 outline-none transition-colors"
      />
    </div>
  );
}

function MetaDateField({ label, value, onChange, isGlobal = false, containerClassName = "" }: { label: string; value: string; onChange: (v: string) => void; isGlobal?: boolean; containerClassName?: string }) {
  return (
    <div className={`flex items-center gap-2 ${containerClassName}`}>
      <label className="text-xs font-medium text-gray-500 whitespace-nowrap">
        <span className="inline-flex items-center gap-1.5" title={isGlobal ? '全局字段' : undefined}>
          {isGlobal && <span className="global-indicator" aria-label="全局字段" />}
          {label}:
        </span>
      </label>
      <input
        type="date"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => e.stopPropagation()}
        className="w-full bg-transparent text-gray-900 text-sm p-1 rounded-md hover:bg-gray-200 focus:bg-white focus:ring-1 focus:ring-blue-500 outline-none transition-colors"
      />
    </div>
  );
}
