import React from 'react';
import { Modal as AntModal, Empty as AntEmpty, Spin, Select } from 'antd';

export const Modal = ({ visible, modalShow, children, bodyHeight, ...rest }) => {
  const open = typeof visible === 'boolean' ? visible : modalShow;
  return (
    <AntModal
      open={open}
      bodyStyle={bodyHeight ? { maxHeight: bodyHeight, overflow: 'auto' } : undefined}
      maskClosable={false}
      destroyOnClose
      {...rest}
    >
      {children}
    </AntModal>
  );
};

export const Alert = ({
  show,
  title,
  abstract,
  ok,
  cancel,
  close,
  okTitle = '确定',
  cancelTitle = '取消',
  okShow = 'y',
  cancelShow = 'y',
  children,
  ...rest
}) => (
  <AntModal
    open={!!show}
    title={title}
    onOk={ok}
    onCancel={cancel || close}
    okText={okTitle}
    cancelText={cancelTitle}
    okButtonProps={{ style: { display: okShow === 'y' ? 'inline-block' : 'none' } }}
    cancelButtonProps={{ style: { display: cancelShow === 'y' ? 'inline-block' : 'none' } }}
    destroyOnClose
    {...rest}
  >
    {children || <p>{abstract}</p>}
  </AntModal>
);

export const Empty = (props) => <AntEmpty {...props} />;

export const Loading = ({ spinning, tip, children }) => (
  <Spin spinning={spinning} tip={tip} style={{ width: '100%' }}>
    {children}
  </Spin>
);

export const DropDown = ({ dropList = [], dropSelectd, width = 160, onChange, placeholder }) => {
  const options = dropList.map((item) => ({ label: item.title, value: item.value }));
  const value = dropSelectd ? dropSelectd.value : undefined;
  return (
    <Select
      style={{ width }}
      value={value}
      options={options}
      placeholder={placeholder}
      onChange={(val) => {
        const selected = dropList.find((item) => item.value === val) || { title: val, value: val };
        onChange && onChange(selected);
      }}
    />
  );
};

export default {
  Modal,
  Alert,
  Empty,
  Loading,
  DropDown,
};
