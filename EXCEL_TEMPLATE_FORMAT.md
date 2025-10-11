# 📋 Excel Upload Format for Quiz Questions

## Required Columns (Case-Sensitive):

| Question | Option1 | Option2 | Option3 | Option4 | CorrectAnswer |
|----------|---------|---------|---------|---------|---------------|
| What is 2+2? | 3 | 4 | 5 | 6 | 2 |
| Capital of France? | London | Paris | Berlin | Rome | 2 |
| Who invented JavaScript? | Brendan Eich | James Gosling | Dennis Ritchie | Guido van Rossum | 1 |

## Column Details:

- **Question**: The question text (required)
- **Option1**: First option (required)
- **Option2**: Second option (required)
- **Option3**: Third option (required)
- **Option4**: Fourth option (required)
- **CorrectAnswer**: Number between 1-4 indicating correct option (required)
  - 1 = Option1
  - 2 = Option2
  - 3 = Option3
  - 4 = Option4

## File Requirements:

✅ **Supported formats**: `.xlsx`, `.xls`, `.csv`
✅ **Max file size**: 5MB
✅ **First row**: Must contain column headers exactly as shown above
✅ **Data rows**: Start from row 2

## Example Excel File Structure:

```
Row 1 (Headers): Question | Option1 | Option2 | Option3 | Option4 | CorrectAnswer
Row 2 (Data):    What is 2+2? | 3 | 4 | 5 | 6 | 2
Row 3 (Data):    Capital of France? | London | Paris | Berlin | Rome | 2
```

## How to Use:

1. Create an Excel file with the format above
2. Go to "Add Questions" page in your quiz
3. Click "Choose File" under "Upload Questions from Excel/CSV"
4. Select your Excel file
5. Click upload and wait for processing
6. Questions will automatically appear in the list!

## Tips:

- Make sure all cells are filled (no empty cells)
- CorrectAnswer must be a number (1, 2, 3, or 4)
- Questions can be as long as needed
- Use proper spelling and grammar
- Test with a small file first (2-3 questions)

## Error Messages:

- **"Row X is missing required fields"**: Check that all columns have values in that row
- **"CorrectAnswer must be between 1 and 4"**: Ensure the CorrectAnswer column has valid numbers
- **"Only Excel files are allowed"**: Upload .xlsx, .xls, or .csv files only
