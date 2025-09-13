
import torch
from transformers import AutoModelForSequenceClassification, AutoTokenizer
from transformers import Trainer, TrainingArguments
from sklearn.metrics import accuracy_score,f1_score


# model_name = "bert-base-multilingual-cased"

# # Option 2: IndicBERT (better for Indian languages)
# model_name = "ai4bharat/indic-bert"

# # Option 3: XLM-RoBERTa (excellent multilingual performance)
# model_name = "xlm-roberta-base"

model_path = "FacebookAI/xlm-roberta-base"

model = AutoModelForSequenceClassification.from_pretrained(model_path)
tokenizer = AutoTokenizer.from_pretrained(model_path)

class HazardClassifier:
    def __init__(self):
        self.model = model
        self.tokenizer = tokenizer
        self.label_mapping = {
            0: "tsunami",
            1: "storm_surge",
            2: "high_waves",
            3: "coastal_flooding",
            4: "swell_surge",
            5: "rip_current",
            6: "other",
            7: "not_hazard"
        }
    def preprocess_text(self,text,max_length=512):
        """Preprocess and Tokenize Text"""
        # cleaned_text = self._clean_text(text)

        # Tokenize 
        tokenized_text = self.tokenizer(
            cleaned_text,
            truncation = True,
            padding = True,
            max_length = max_length,
            return_tensors = "pt"
        )

        return tokenized_text
    


