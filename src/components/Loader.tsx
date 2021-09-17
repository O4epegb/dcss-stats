import refreshSvg from '@refresh.svg';

export const Loader = () => {
  return (
    <div className="flex items-center justify-center">
      <div className="w-5 h-5 animate-spin" style={{ backgroundImage: `url(${refreshSvg.src})` }} />
    </div>
  );
};
