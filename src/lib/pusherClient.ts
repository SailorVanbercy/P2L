import PusherJS from 'pusher-js'

let pusherInstance: PusherJS | null = null

export function getPusherClient(): PusherJS {
  if (!pusherInstance) {
    pusherInstance = new PusherJS(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
    })
  }
  return pusherInstance
}
