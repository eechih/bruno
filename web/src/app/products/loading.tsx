import Box from '@/wrapped/material/Box'
import Container from '@/wrapped/material/Container'
import Skeleton, { SkeletonProps } from '@/wrapped/material/Skeleton'
import Stack from '@/wrapped/material/Stack'

const MySkeleton = (props: SkeletonProps) => (
  <Skeleton animation="wave" variant="rectangular" width="100%" {...props} />
)

export default function Loading() {
  return (
    <Container disableGutters maxWidth="lg">
      <Stack py={2} px={1}>
        <MySkeleton width={180} height={24} />
      </Stack>
      <Stack direction="column" px={1} pb={1.25}>
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
        >
          <Stack>
            <MySkeleton width={120} height={36} />
          </Stack>
          <Stack direction="row" spacing={2}>
            <MySkeleton width={64} height={36} />
            <MySkeleton width={88} height={36} />
          </Stack>
        </Stack>
      </Stack>
      <Stack>
        <Box padding={1}>
          <MySkeleton width={360} height={20} />
        </Box>
        <Box padding={1}>
          <MySkeleton height={36} />
        </Box>
        <Box padding={1}>
          <MySkeleton height={36} />
        </Box>
        <Box padding={1}>
          <MySkeleton height={36} />
        </Box>
        <Box padding={1}>
          <MySkeleton height={36} />
        </Box>
        <Box padding={1}>
          <MySkeleton height={36} />
        </Box>
        <Box padding={1}>
          <MySkeleton height={36} />
        </Box>
        <Box padding={1}>
          <MySkeleton height={36} />
        </Box>
        <Box padding={1}>
          <MySkeleton height={36} />
        </Box>
        <Box padding={1}>
          <MySkeleton height={40} />
        </Box>
      </Stack>
    </Container>
  )
}
