import { useFormContext } from 'react-hook-form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'

interface FormQuestionProps {
  question: {
    id: string
    type: string
    label: string
    description?: string
    placeholder?: string
    required: boolean
    config: any
  }
}

export function FormQuestion({ question }: FormQuestionProps) {
  const { register, formState: { errors } } = useFormContext()

  const renderInput = () => {
    switch (question.type) {
      case 'SHORT_TEXT':
      case 'EMAIL':
      case 'PHONE':
      case 'URL':
        return (
          <Input
            {...register(question.id, {
              required: question.required ? 'This field is required' : false,
            })}
            type={question.type === 'EMAIL' ? 'email' : question.type === 'PHONE' ? 'tel' : 'text'}
            placeholder={question.placeholder}
            className="w-full"
          />
        )

      case 'LONG_TEXT':
      case 'ESSAY':
        return (
          <Textarea
            {...register(question.id, {
              required: question.required ? 'This field is required' : false,
              minLength: question.config.minLength ? {
                value: question.config.minLength,
                message: `Minimum ${question.config.minLength} characters required`
              } : undefined,
              maxLength: question.config.maxLength ? {
                value: question.config.maxLength,
                message: `Maximum ${question.config.maxLength} characters allowed`
              } : undefined,
            })}
            placeholder={question.placeholder}
            rows={question.type === 'ESSAY' ? 8 : 4}
            className="w-full"
          />
        )

      case 'NUMBER':
        return (
          <Input
            {...register(question.id, {
              required: question.required ? 'This field is required' : false,
              min: question.config.min,
              max: question.config.max,
            })}
            type="number"
            step={question.config.step || 1}
            min={question.config.min}
            max={question.config.max}
            placeholder={question.placeholder}
            className="w-full"
          />
        )

      case 'DATE':
        return (
          <Input
            {...register(question.id, {
              required: question.required ? 'This field is required' : false,
            })}
            type="date"
            className="w-full"
          />
        )

      case 'TIME':
        return (
          <Input
            {...register(question.id, {
              required: question.required ? 'This field is required' : false,
            })}
            type="time"
            className="w-full"
          />
        )

      case 'SINGLE_CHOICE':
        return (
          <div className="space-y-3">
            {question.config.options?.map((option: any) => (
              <label
                key={option.id}
                className="flex items-center gap-3 p-4 border-2 border-gray-200 rounded-lg hover:border-purple-300 hover:bg-purple-50 cursor-pointer transition"
              >
                <input
                  {...register(question.id, {
                    required: question.required ? 'Please select an option' : false,
                  })}
                  type="radio"
                  value={option.value}
                  className="w-4 h-4 text-purple-600"
                />
                <span className="text-gray-900">{option.label}</span>
              </label>
            ))}
          </div>
        )

      case 'MULTIPLE_CHOICE':
        return (
          <div className="space-y-3">
            {question.config.options?.map((option: any) => (
              <label
                key={option.id}
                className="flex items-center gap-3 p-4 border-2 border-gray-200 rounded-lg hover:border-purple-300 hover:bg-purple-50 cursor-pointer transition"
              >
                <input
                  {...register(question.id)}
                  type="checkbox"
                  value={option.value}
                  className="w-4 h-4 text-purple-600 rounded"
                />
                <span className="text-gray-900">{option.label}</span>
              </label>
            ))}
          </div>
        )

      case 'RATING':
        return (
          <div className="flex gap-2">
            {Array.from({ length: question.config.maxValue || 5 }, (_, i) => i + 1).map((value) => (
              <label
                key={value}
                className="flex items-center justify-center w-12 h-12 border-2 border-gray-200 rounded-lg hover:border-purple-300 hover:bg-purple-50 cursor-pointer transition"
              >
                <input
                  {...register(question.id, {
                    required: question.required ? 'Please select a rating' : false,
                  })}
                  type="radio"
                  value={value}
                  className="sr-only"
                />
                <span className="text-lg font-semibold">{value}</span>
              </label>
            ))}
          </div>
        )

      case 'SCALE':
        return (
          <div className="space-y-4">
            <input
              {...register(question.id, {
                required: question.required ? 'This field is required' : false,
              })}
              type="range"
              min={question.config.minValue || 0}
              max={question.config.maxValue || 10}
              step={question.config.step || 1}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
            <div className="flex justify-between text-sm text-gray-600">
              <span>{question.config.minLabel || question.config.minValue || 0}</span>
              <span>{question.config.maxLabel || question.config.maxValue || 10}</span>
            </div>
          </div>
        )

      default:
        return (
          <div className="text-gray-500 italic">
            Question type "{question.type}" not yet implemented
          </div>
        )
    }
  }

  return (
    <div className="space-y-3">
      <label className="block">
        <div className="flex items-start gap-2 mb-2">
          <span className="text-lg font-medium text-gray-900">
            {question.label}
            {question.required && <span className="text-red-500 ml-1">*</span>}
          </span>
        </div>
        {question.description && (
          <p className="text-sm text-gray-600 mb-3">{question.description}</p>
        )}
        {renderInput()}
      </label>
      {errors[question.id] && (
        <p className="text-sm text-red-600">
          {errors[question.id]?.message as string}
        </p>
      )}
    </div>
  )
}
