'use client'

import LoadingButton from '@mui/lab/LoadingButton'
import Button from '@mui/material/Button'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import Grid from '@mui/material/Unstable_Grid2'
import moment from 'moment'
import Link from 'next/link'
import { useEffect } from 'react'
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
import { providers } from '@/lib/constants'
import { createProduct } from '@/lib/functions'
import { CreateProductInput, Product } from '@/lib/types'

export type ProductFormInputs = {
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

export type ProductFormProps = { product?: Product }

export default function ProductForm({ product }: ProductFormProps) {
  const isCreation = !product

  const methods = useForm<ProductFormInputs>({ defaultValues: initialInputs })
  const { reset, handleSubmit, control, formState, setError } = methods
  const { isDirty, isValid, dirtyFields, isSubmitting, errors } = formState

  useEffect(() => {
    if (product) {
      reset(convertToInputs(product))
    } else {
      reset(initialInputs)
    }
  }, [product, reset])

  const onSubmit: SubmitHandler<ProductFormInputs> = async data => {
    console.log('onSubmit', data)

    const input: CreateProductInput = {
      name: data.name,
      price: Number(data.price),
      cost: Number(data.cost),
      description: data.description,
      provider: data.provider,
      offShelfAt: moment(
        data.offShelfDate + 'T' + data.offShelfTime
      ).toISOString(),
    }
    const product = await createProduct(input)
    console.log('product', product)
  }

  return (
    <FormProvider {...methods}>
      <Grid container spacing={2}>
        <Grid xs={12} md={6}>
          <Stack spacing={2}>
            <Typography variant="h6">基本設定</Typography>
            <Input
              name="name"
              control={control}
              rules={{ required: '必須提供名稱' }}
              label="名稱"
              type="txt"
              required
              fullWidth
              autoFocus={isCreation}
            />
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
            <Input
              name="option"
              control={control}
              label="規格"
              type="txt"
              fullWidth
              helperText="'範例：紅，黑，白 / XL，L，M'"
            />
            <Select
              name="provider"
              control={control}
              label="供應商"
              options={providers}
              fullWidth
            />
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
            <Stack direction="row" spacing={2}>
              <Input
                name="offShelfDate"
                control={control}
                label="下架日期"
                type="date"
                fullWidth
              />
              <Input
                name="offShelfTime"
                control={control}
                label="下架時間"
                type="time"
                fullWidth
              />
            </Stack>
          </Stack>
          {/* </Paper> */}
        </Grid>

        <Grid xs={12} md={6}>
          <Stack spacing={2}>
            <Typography variant="h6">社群貼文內容</Typography>
            <Input
              name="description"
              type="txt"
              control={control}
              label="描述"
              fullWidth
              minRows={15}
              multiline
            />
          </Stack>
        </Grid>

        <Grid xs={12}>
          <Stack spacing={2}>
            <Typography variant="h6">產品圖片</Typography>
            <ImageFieldArray control={control} />
          </Stack>
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
              {isCreation ? '建立產品' : '儲存變更'}
            </LoadingButton>
          </Stack>
        </Grid>
        <Grid xs={12}>
          {errors.root && <ErrorMessage error={errors.root} />}
        </Grid>
      </Grid>
    </FormProvider>
  )
}

function convertToInputs(product: Product): ProductFormInputs {
  const offShelfAt = moment(product.offShelfAt)
  const offShelfDate = offShelfAt.isValid()
    ? offShelfAt.format('yyyy-MM-DD')
    : ''
  const offShelfTime = offShelfAt.isValid() ? offShelfAt.format('HH:mm') : ''

  return {
    name: product.name,
    price: product.price?.toString() ?? '',
    cost: product.cost?.toString() ?? '',
    provider: product.provider ?? '',
    offShelfDate,
    offShelfTime,
    description: product.description ?? '',
    option: '',
    images: [],
  }
}

const initialInputs: ProductFormInputs = {
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

function ImageFieldArray(props: { control: Control<ProductFormInputs> }) {
  const { control } = props
  const { fields, append, remove } = useFieldArray({
    control,
    name: 'images',
  })
  const { resetField } = useFormContext()

  return (
    <StorageManager
      acceptedFileTypes={['image/*']}
      accessLevel="private"
      defaultFiles={fields}
      processFile={HashHexFileNameStrategy}
    />
  )
}
