// This public web-directory intentionally ships without any Channel Talk key.
// Add your own Plugin Key in a deployment-specific integration to enable Messenger.
export async function openCuriosity() {
  throw new Error('이 내보내기에는 채널톡 Plugin Key가 포함되어 있지 않아요.');
}
