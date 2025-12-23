import React, { useEffect } from 'react';

const FrameWork = ({ pageInit = () => {}, children }) => {
  useEffect(() => {
    pageInit();
  }, []);

  return <>{children}</>;
};

export default FrameWork;
