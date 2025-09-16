// src/components/modals/ProfileEditModal.tsx
'use client';

import { useEffect, useState } from 'react';
import Modal from './Modal';
import ConfirmDialog from './ConfirmModal';
import PasswordChangeModal from './PasswordChangeModal';
import NicknameChangeModal from './NickNameChangeModal';
import { updateUser } from '@/lib/swr';
import { withdrawUser } from '@/lib/swr';
import type { UserMe } from '@/types/user';

export default function ProfileEditModal({
  open, onClose, me, onSave, onWithdrawDone
}: {
  open: boolean;
  onClose: () => void;
  me?: UserMe;
  onSave?: (v: { name:string; email:string; phone:string; birth:string; nickname:string }) => Promise<void> | void;
  onWithdrawDone?: () => void; // 탈퇴 후 처리(로그아웃/리다이렉트 등)
}) {
  const [name, setName] = useState(''); 
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [birth, setBirth] = useState('');
  const [nickname, setNickname] = useState('');
  const [confirmOpen, setConfirmOpen] = useState(false); // 탈퇴 확인 모달
  const [pwChangeOpen, setPwChangeOpen] = useState(false); // 비밀번호 변경 모달
  const [nickChangeOpen, setNickChangeOpen] = useState(false); // 닉네임 변경 모달
  

  useEffect(() => {
    if (!open) return;
    setName(me?.user_name ?? '');
    setEmail(me?.email ?? '');
    setPhone(me?.phone_number ?? '');
    setBirth(me?.birth_date ?? '');
    setNickname(me?.nickname ?? '');
  }, [open, me]);

  const handleSave = async () => {
    await onSave?.({ name, email, phone, birth, nickname });
    onClose();
  };

   return (
    <>
      <Modal open={open} onClose={onClose} title="나의 정보 수정하기" width={700}>
        {/* 입력 폼들 */}
        <Label title="이름"><input value={name} onChange={e=>setName(e.target.value)} style={input}/></Label>
        <Label title="아이디(이메일)"><input value={email} onChange={e=>setEmail(e.target.value)} style={input}/></Label>
        <Label title="전화번호"><input value={phone} onChange={e=>setPhone(e.target.value)} placeholder="010-1234-1234" style={input}/></Label>
        <Label title="생년월일"><input value={birth} onChange={e=>setBirth(e.target.value)} placeholder="2000.01.01" style={input}/></Label>

        {/* 닉네임 + 회원탈퇴 링크 (오른쪽 아래 작은 글씨) */}
        <div style={{ position:'relative', marginBottom:14 }}>
          <div style={{ marginBottom:6, fontWeight:700, fontSize:14 }}>닉네임</div>
          <input value={nickname} onChange={e=>setNickname(e.target.value)} style={input}/>
          <button
            type="button"
            onClick={()=>setConfirmOpen(true)}
            style={{
              position:'absolute', right:0, bottom:-18, fontSize:12, color:'#9ca3af',
              background:'none', border:'none', cursor:'pointer', textDecoration:'underline'
            }}
          >
            회원탈퇴
          </button>
        </div>

        {/* 하단 버튼 */}
        {/* 하단 버튼 두 개 -> 각각 모달 오픈 */}
        <div className="flex gap-3 justify-center mt-6">
          <button className="btn-primary" onClick={() => setPwChangeOpen(true)}>비밀번호 수정하기</button>
          <button className="btn-primary" onClick={() => setNickChangeOpen(true)}>닉네임 수정하기</button>
        </div>

        {/* 서브 모달 2종 */}
        <PasswordChangeModal
          open={pwChangeOpen}
          onClose={() => setPwChangeOpen(false)}
          onChanged={() => {/* 필요 시 토스트 등 */}}
        />
        <NicknameChangeModal
          open={nickChangeOpen}
          onClose={() => setNickChangeOpen(false)}
          current={/* 현재 닉네임 값 */ me?.nickname}
          onChanged={() => {/* /user/me 갱신은 updateNickname 내부에서 처리됨 */}}
        />
      </Modal>

      {/* 안내/확인 모달 */}
      <ConfirmDialog
        open={confirmOpen}
        onClose={()=>setConfirmOpen(false)}
        title="회원탈퇴 안내"
        danger
        confirmText="정말 탈퇴합니다"
        cancelText="취소"
        message={
          <>
            탈퇴 시 계정과 보유 데이터가 삭제되며 복구가 불가능합니다.
            {'\n'}정말로 회원을 탈퇴하시겠습니까?
          </>
        }
        onConfirm={async () => {
          await withdrawUser();
          onWithdrawDone?.(); // 로그아웃/리다이렉트 등
        }}
      />
    </>
  );
}

function Label({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <label style={{ display:'block', marginBottom:14 }}>
      <div style={{ marginBottom:6, fontWeight:700, fontSize:14 }}>{title}</div>
      {children}
    </label>
  );
}

const input: React.CSSProperties = {
  width: '100%', padding: '10px 12px', border: '1px solid #cfd4dc', borderRadius: 8, outline: 'none'
};
const primaryBtn: React.CSSProperties = {
  padding:'10px 16px', background:'#5b8ef1', color:'#fff', border:'none', borderRadius:8, fontWeight:700, cursor:'pointer'
};

function FormRow({ label, children }:{label:string; children:React.ReactNode}) {
  return (
    <label style={{ display:'block', marginBottom:14 }}>
      <div style={{ marginBottom:6, fontWeight:700, fontSize:14 }}>{label}</div>
      {children}
    </label>
  );
}

const styles: Record<string, React.CSSProperties> = {
  input: {
    width:'100%', padding:'10px 12px', border:'1px solid #cfd4dc',
    borderRadius:8, outline:'none',
  },
  primary: {
    padding:'10px 16px', background:'#5b8ef1', color:'#fff',
    border:'none', borderRadius:8, fontWeight:700, cursor:'pointer',
  },
};
