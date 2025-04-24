export const generateNickName = () => {
  const basicNickname = "Mulfon";

  const randomNumber = Math.floor(Math.random() * 10000);

  return `${basicNickname}${randomNumber}`;
};
