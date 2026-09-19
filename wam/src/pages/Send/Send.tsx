import { useEffect, useCallback, useState } from 'react'
import {
  useCallFunction,
  useNativeFunction,
  useWamClose,
  useWamSize,
} from '@channel.io/app-sdk-wam'
import {
  TUTORIAL_FUNCTIONS,
  type SendAsBotInput,
  type WriteGroupMessageAsManagerInput,
} from '@tutorial/shared'
import {
  VStack,
  HStack,
  Button,
  Text,
  Icon,
  ButtonGroup,
} from '@channel.io/bezier-react/beta'
import { SendIcon } from '@channel.io/bezier-icons'
import { InlineBanner } from '@channel.io/app-sdk-wam-ui'

import { useTutorialWamData } from '../../hooks/useTutorialWamData'

function Send() {
  const { setSize } = useWamSize()
  const { close } = useWamClose()
  const [errorMessage, setErrorMessage] = useState('')
  const { data: wamData, error: wamDataError } = useTutorialWamData()

  useEffect(() => {
    setSize({ width: 390, height: 260 })
  }, [setSize])

  const chatTitle = wamData?.chatTitle ?? ''
  const appId = wamData?.appId ?? ''
  const channelId = wamData?.channelId ?? ''
  const managerId = wamData?.managerId ?? ''
  const message = wamData?.message ?? ''
  const chatId = wamData?.chatId ?? ''
  const chatType = wamData?.chatType ?? ''
  const broadcast = wamData?.broadcast ?? false
  const rootMessageId = wamData?.rootMessageId
  const targetToken = wamData?.targetToken ?? ''

  const {
    call: sendAsBot,
    loading: botLoading,
    error: botError,
  } = useCallFunction<void>({
    appId,
    name: TUTORIAL_FUNCTIONS.sendAsBot,
  })
  const {
    call: sendAsManager,
    loading: managerLoading,
    error: managerError,
  } = useNativeFunction<void>({ name: TUTORIAL_FUNCTIONS.writeAsManager })

  const isSending = botLoading || managerLoading
  const statusMessage =
    errorMessage ||
    (wamDataError
      ? wamDataError.message
      : botError || managerError
        ? 'The message could not be sent. Check the app permissions and try again.'
        : chatType === 'group' && !targetToken
          ? 'The bot target is unavailable. Close and reopen the command.'
          : chatType && chatType !== 'group'
            ? 'This tutorial sends messages only from a group chat.'
            : '')

  const handleSend = useCallback(
    async (sender: 'bot' | 'manager'): Promise<void> => {
      setErrorMessage('')
      if (!wamData) {
        setErrorMessage(
          'The host did not provide the expected tutorial WAM data.'
        )
        return
      }
      if (chatType !== 'group') {
        setErrorMessage('This tutorial sends messages only from a group chat.')
        return
      }

      try {
        switch (sender) {
          case 'bot': {
            const input: SendAsBotInput = {
              targetToken,
              broadcast,
              rootMessageId,
            }
            await sendAsBot(input)
            break
          }
          case 'manager': {
            const input: WriteGroupMessageAsManagerInput = {
              channelId,
              groupId: chatId,
              rootMessageId,
              broadcast,
              dto: {
                plainText: message,
                managerId,
              },
            }
            await sendAsManager(input)
            break
          }
        }
        close()
      } catch {
        setErrorMessage(
          'The message could not be sent. Check the app permissions and try again.'
        )
      }
    },
    [
      broadcast,
      channelId,
      chatId,
      chatType,
      close,
      managerId,
      message,
      rootMessageId,
      sendAsBot,
      sendAsManager,
      targetToken,
      wamData,
    ]
  )

  return (
    <VStack spacing={16}>
      <VStack
        spacing={4}
        align="center"
      >
        <Text
          as="h1"
          typo="24"
          bold
          color="text-neutral-heaviest"
        >
          Hello, world! 👋
        </Text>
        <Text
          as="p"
          typo="13"
          color="text-neutral-light"
        >
          SKKU 2026 team3 · Channel App SDK
        </Text>
      </VStack>
      <HStack justify="center">
        <ButtonGroup>
          <Button
            variant="filled"
            semantic="primary"
            label="매니저로 인사하기"
            disabled={chatType !== 'group' || isSending}
            onClick={() => void handleSend('manager')}
          />
          <Button
            variant="filled"
            semantic="primary"
            label="봇으로 인사하기"
            disabled={chatType !== 'group' || isSending || !targetToken}
            onClick={() => void handleSend('bot')}
          />
        </ButtonGroup>
      </HStack>
      <HStack justify="center">
        <HStack
          as="span"
          align="center"
          justify="center"
          spacing={2}
        >
          <Icon
            source={SendIcon}
            color="icon-neutral-heavy"
            size="12"
          />
          <Text
            as="span"
            color="text-neutral-light"
          >
            {chatTitle}
          </Text>
        </HStack>
      </HStack>
      {statusMessage && (
        <InlineBanner
          variant={
            errorMessage || wamDataError || botError || managerError
              ? 'error'
              : 'info'
          }
          content={statusMessage}
        />
      )}
    </VStack>
  )
}

export default Send
