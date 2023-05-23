'use client'

import LoadingButton from '@mui/lab/LoadingButton'
import Button from '@mui/material/Button'
import Container from '@mui/material/Container'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import Grid from '@mui/material/Unstable_Grid2'
import { useTheme } from '@mui/material/styles'
import useMediaQuery from '@mui/material/useMediaQuery'
import moment from 'moment'
import Link from 'next/link'
import {
  Control,
  FormProvider,
  SubmitHandler,
  useFieldArray,
  useForm,
  useFormContext,
} from 'react-hook-form'

import StorageManager, {
  HashHexFileNameStrategy,
} from '@/components/StorageManager'
import { ErrorMessage, Input, Select } from '@/components/forms'
import WrappedBreadcrumbs from '@/components/shared/WrappedBreadcrumbs'

export enum FormAction {
  CREATION = 'creation',
  EDITION = 'edition',
}

const providers = [
  {
    value: '',
    label: '-',
  },
  {
    value: 'CAT',
    label: '葉貓子 日韓彩妝食品雜貨批發社團',
  },
  {
    value: 'MONEY',
    label: 'MONEY株式會社',
  },
  {
    value: 'APPLE',
    label: 'GAUK✿日韓台✿彩妝&用品&食品&銀飾等商品',
  },
  {
    value: 'MITAGO',
    label: 'Mitago商城',
  },
]

type Inputs = {
  name: string
  price: string
  cost: string
  provider: string
  offShelfDate: string
  offShelfTime: string
  description: string
  option: string
  images: { key: string }[]
}

const initialInputs: Inputs = {
  name: '',
  price: '',
  cost: '',
  provider: 'CAT',
  offShelfDate: moment().utcOffset(8).format('yyyy-MM-DD'),
  offShelfTime: '20:00',
  option: '',
  description: '',
  images: [],
}

function ImageFieldArray(props: { control: Control<Inputs> }) {
  const { control } = props
  const { fields, append, remove } = useFieldArray({
    control,
    name: 'images',
  })
  const { resetField } = useFormContext()

  return (
    <StorageManager
      acceptedFileTypes={['image/*']}
      accessLevel="public"
      defaultFiles={fields}
      processFile={HashHexFileNameStrategy}
    />
  )
}

export default function Page({ params }: { params: { id: string } }) {
  const { id } = params
  console.log('id', id)
  const action = id == 'create' ? FormAction.CREATION : FormAction.EDITION
  console.log('action', action)

  const theme = useTheme()
  const matches = useMediaQuery(theme.breakpoints.up('md'), { noSsr: true })

  const methods = useForm<Inputs>({ defaultValues: initialInputs })
  const { reset, handleSubmit, control, formState, setError } = methods
  const { isDirty, isValid, dirtyFields, isSubmitting, errors } = formState

  const onSubmit: SubmitHandler<Inputs> = async data => {
    console.log('onSubmit', data)
  }
  return (
    <Container disableGutters sx={{ marginLeft: 0 }}>
      <WrappedBreadcrumbs
        links={[
          { children: '首頁', href: '/' },
          { children: '產品列表', href: '/products' },
          { children: action == FormAction.EDITION ? '編輯產品' : '建立產品' },
        ]}
      />
      <Stack
        direction="row"
        py={2}
        justifyContent="space-between"
        alignItems="center"
      >
        {action == FormAction.EDITION && id ? (
          <Stack direction="row" alignItems="center" spacing={1}>
            <Typography variant="h6">產品</Typography>
            <Typography variant="body1">is.substring(0, 8)</Typography>
          </Stack>
        ) : (
          <Typography variant="h6">建立產品</Typography>
        )}
      </Stack>
      <FormProvider {...methods}>
        <Grid container spacing={2}>
          <Grid xs={12} md={6}>
            <Paper variant={matches ? 'outlined' : 'elevation'} elevation={0}>
              <Grid container spacing={2} padding={matches ? 2 : 0}>
                <Grid>
                  <Typography variant="h6">基本設定</Typography>
                </Grid>
                <Grid xs={12}>
                  <Input
                    name="name"
                    control={control}
                    rules={{ required: '必須提供名稱' }}
                    label="名稱"
                    type="txt"
                    required
                    fullWidth
                    autoFocus={action == FormAction.CREATION}
                  />
                </Grid>
                <Grid xs={12}>
                  <Input
                    name="price"
                    control={control}
                    rules={{
                      required: '必須提供售價',
                      min: { value: 0, message: '售價不可小於零' },
                    }}
                    label="價格"
                    type="number"
                    required
                    fullWidth
                  />
                </Grid>
                <Grid xs={12}>
                  <Input
                    name="option"
                    control={control}
                    label="規格"
                    type="txt"
                    fullWidth
                    helperText="'範例：紅，黑，白 / XL，L，M'"
                  />
                </Grid>
                <Grid xs={12}>
                  <Select
                    name="provider"
                    control={control}
                    label="供應商"
                    options={providers}
                    fullWidth
                  />
                </Grid>
                <Grid xs={12}>
                  <Input
                    name="cost"
                    control={control}
                    rules={{
                      min: { value: 0, message: '成本不可小於零' },
                    }}
                    label="成本"
                    type="number"
                    fullWidth
                  />
                </Grid>
                <Grid xs={6}>
                  <Input
                    name="offShelfDate"
                    control={control}
                    label="下架日期"
                    type="date"
                    fullWidth
                  />
                </Grid>
                <Grid xs={6}>
                  <Input
                    name="offShelfTime"
                    control={control}
                    label="下架時間"
                    type="time"
                    fullWidth
                  />
                </Grid>
              </Grid>
            </Paper>
          </Grid>

          <Grid xs={12} md={6}>
            <Paper variant={matches ? 'outlined' : 'elevation'} elevation={0}>
              <Grid container spacing={2} padding={matches ? 2 : 0}>
                <Grid>
                  <Typography variant="h6">社群貼文內容</Typography>
                </Grid>
                <Grid xs={12}>
                  <Input
                    name="description"
                    type="txt"
                    control={control}
                    label="描述"
                    fullWidth
                    minRows={15}
                    multiline
                  />
                </Grid>
              </Grid>
            </Paper>
          </Grid>
          <Grid xs={12}>
            <Paper variant={matches ? 'outlined' : 'elevation'} elevation={0}>
              <Grid container spacing={2} padding={matches ? 2 : 0}>
                <Grid>
                  <Typography variant="h6">產品圖片</Typography>
                </Grid>
                <Grid xs={12}>
                  <ImageFieldArray control={control} />
                </Grid>
              </Grid>
            </Paper>
          </Grid>

          <Grid xs={12}>
            <Stack direction="row" justifyContent="end" spacing={2}>
              <Button
                variant="outlined"
                color="inherit"
                LinkComponent={Link}
                href="/products"
              >
                取消
              </Button>
              <LoadingButton
                variant="contained"
                color="primary"
                onClick={handleSubmit(onSubmit)}
                disabled={!isDirty || !isValid}
                loading={isSubmitting}
              >
                {action == FormAction.EDITION ? '儲存變更' : '建立產品'}
              </LoadingButton>
            </Stack>
          </Grid>
          <Grid xs={12}>
            {errors.root && <ErrorMessage error={errors.root} />}
          </Grid>
        </Grid>
      </FormProvider>
    </Container>
  )
}
