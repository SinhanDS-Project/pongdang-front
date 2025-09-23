'use client';

import { useState } from 'react';
import Modal from './Modal';

type Mode = 'pay' | 'balance';

export default function DonationConsentModal({
  open,
  onClose,
  onProceed,
  defaultMode = 'balance',
}: {
  open: boolean;
  onClose: () => void;
  onProceed: (mode: Mode) => void;  // 확인을 누르면 선택 모드와 함께 진행
  defaultMode?: Mode;
}) {
  const [mode, setMode] = useState<Mode>(defaultMode);
  const [agree1, setAgree1] = useState<boolean | null>(null);
  const [agree2, setAgree2] = useState<boolean | null>(null);
  const [expand1, setExpand1] = useState(false);

  const canProceed = agree1 === true && agree2 === true;

  return (
    <Modal open={open} onClose={onClose} title="기부 전 동의 안내" width={560}>
      {/* 동의 1 */}
      <section className="mb-4 rounded-md border p-3">
        <h4 className="mb-2 text-sm font-bold">
          개인정보 수집/제공 동의 및 기부금 영수증 신청
        </h4>
        <p className="text-xs text-neutral-600">
          기부하시면 소득세법에 따라 세액공제를 받으실 수 있도록 기부금 영수증을
          발급할 수 있어요. 영수증 발급과 관련된 개인정보 처리를 위해 아래 내용에
          동의해 주세요.
        </p>
        <button
          className="mt-2 text-xs text-emerald-600 underline"
          onClick={() => setExpand1((v) => !v)}
          type="button"
        >
          {expand1 ? '접기' : '자세히 보기'}
        </button>
        {expand1 && (
          <ul className="mt-2 list-disc pl-4 text-xs text-neutral-600 space-y-1">
            <li>이용 목적: 기부금 영수증 발급 및 국세청 간소화 서비스 제공</li>
            <li>보유 및 이용 기간: 관계 법령에 따른 보존기간</li>
            <li>수집 항목: 성명, 생년월일, 연락처 등</li>
          </ul>
        )}

        <div className="mt-3 flex items-center gap-4 text-sm">
          <label className="inline-flex items-center gap-2">
            <input
              type="radio"
              checked={agree1 === true}
              onChange={() => setAgree1(true)}
            />
            동의함
          </label>
          <label className="inline-flex items-center gap-2">
            <input
              type="radio"
              checked={agree1 === false}
              onChange={() => setAgree1(false)}
            />
            동의하지 않음
          </label>
        </div>
      </section>

      {/* 동의 2 */}
      <section className="mb-4 rounded-md border p-3">
        <h4 className="mb-2 text-sm font-bold">
          기부금 영수증 발행을 위한 개인정보 제3자 제공 동의
        </h4>
        <ol className="text-xs text-neutral-600 space-y-1">
          <li>제공 받는 자: 국세청</li>
          <li>제공 항목: 성명, 생년월일(또는 CI), 기부금액 등</li>
          <li>이용 목적: 연말정산 간소화 서비스에 기부금액 반영</li>
          <li>보유 기간: 관련 법령에 따름</li>
        </ol>

        <div className="mt-3 flex items-center gap-4 text-sm">
          <label className="inline-flex items-center gap-2">
            <input
              type="radio"
              checked={agree2 === true}
              onChange={() => setAgree2(true)}
            />
            동의함
          </label>
          <label className="inline-flex items-center gap-2">
            <input
              type="radio"
              checked={agree2 === false}
              onChange={() => setAgree2(false)}
            />
            동의하지 않음
          </label>
        </div>
      </section>

      <div className="mt-5 flex justify-end gap-2">
        <button className="btn-ghost" onClick={onClose}>
          취소
        </button>
        <button
          className="btn-primary disabled:opacity-40"
          disabled={!canProceed}
          onClick={() => onProceed(mode)}
        >
          확인
        </button>
      </div>
    </Modal>
  );
}
