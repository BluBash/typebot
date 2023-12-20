import {
  Button,
  ButtonProps,
  IconButton,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  Stack,
  Text,
} from '@chakra-ui/react'
import { ChevronLeftIcon, PlusIcon, TrashIcon } from '@/components/icons'
import React, { useCallback, useState } from 'react'
import { useToast } from '../../../hooks/useToast'
import { Credentials } from '@typebot.io/schemas'
import { trpc } from '@/lib/trpc'
import { useWorkspace } from '@/features/workspace/WorkspaceProvider'

type Props = Omit<ButtonProps, 'type'> & {
  type: Credentials['type']
  workspaceId: string
  currentCredentialsId?: string
  onCredentialsSelect: (credentialId?: string) => void
  onCreateNewClick: () => void
  defaultCredentialLabel?: string
  credentialsName: string
}

export const CredentialsDropdown = ({
  type,
  workspaceId,
  currentCredentialsId,
  onCredentialsSelect,
  onCreateNewClick,
  defaultCredentialLabel,
  credentialsName,
  ...props
}: Props) => {
  const { showToast } = useToast()
  const { currentRole } = useWorkspace()
  const { data, refetch } = trpc.credentials.listCredentials.useQuery({
    workspaceId,
    type,
  })
  const [isDeleting, setIsDeleting] = useState<string>()
  const { mutate } = trpc.credentials.deleteCredentials.useMutation({
    onMutate: ({ credentialsId }) => {
      setIsDeleting(credentialsId)
    },
    onError: (error) => {
      showToast({
        description: error.message,
      })
    },
    onSuccess: ({ credentialsId }) => {
      if (credentialsId === currentCredentialsId) onCredentialsSelect(undefined)
      refetch()
    },
    onSettled: () => {
      setIsDeleting(undefined)
    },
  })

  const defaultCredentialsLabel =
    defaultCredentialLabel ?? `Select ${credentialsName}`

  const currentCredential = data?.credentials.find(
    (c) => c.id === currentCredentialsId
  )

  const handleMenuItemClick = useCallback(
    (credentialsId: string) => () => {
      onCredentialsSelect(credentialsId)
    },
    [onCredentialsSelect]
  )

  const deleteCredentials =
    (credentialsId: string) => async (e: React.MouseEvent) => {
      e.stopPropagation()
      mutate({ workspaceId, credentialsId })
    }

  if (data?.credentials.length === 0 && !defaultCredentialLabel) {
    return (
      <Button
        colorScheme="gray"
        textAlign="left"
        leftIcon={<PlusIcon />}
        onClick={onCreateNewClick}
        isDisabled={currentRole === 'GUEST'}
        {...props}
      >
        Add {credentialsName}
      </Button>
    )
  }
  return (
    <Menu isLazy>
      <MenuButton
        as={Button}
        rightIcon={<ChevronLeftIcon transform={'rotate(-90deg)'} />}
        colorScheme="gray"
        justifyContent="space-between"
        textAlign="left"
        {...props}
      >
        <Text
          noOfLines={1}
          overflowY="visible"
          h={props.size === 'sm' ? '18px' : '20px'}
        >
          {currentCredential ? currentCredential.name : defaultCredentialsLabel}
        </Text>
      </MenuButton>
      <MenuList>
        <Stack maxH={'35vh'} overflowY="scroll" spacing="0">
          {defaultCredentialLabel && (
            <MenuItem
              maxW="500px"
              overflow="hidden"
              whiteSpace="nowrap"
              textOverflow="ellipsis"
              onClick={handleMenuItemClick('default')}
            >
              {defaultCredentialLabel}
            </MenuItem>
          )}
          {data?.credentials.map((credentials) => (
            <MenuItem
              role="menuitem"
              minH="40px"
              key={credentials.id}
              onClick={handleMenuItemClick(credentials.id)}
              fontSize="16px"
              fontWeight="normal"
              rounded="none"
              justifyContent="space-between"
            >
              {credentials.name}
              <IconButton
                icon={<TrashIcon />}
                aria-label="Remove credentials"
                size="xs"
                onClick={deleteCredentials(credentials.id)}
                isLoading={isDeleting === credentials.id}
              />
            </MenuItem>
          ))}
          {currentRole === 'GUEST' ? null : (
            <MenuItem
              maxW="500px"
              overflow="hidden"
              whiteSpace="nowrap"
              textOverflow="ellipsis"
              icon={<PlusIcon />}
              onClick={onCreateNewClick}
            >
              Connect new
            </MenuItem>
          )}
        </Stack>
      </MenuList>
    </Menu>
  )
}
