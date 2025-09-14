
import torch
from transformers import AutoModelForSequenceClassification, AutoTokenizer
from transformers import Trainer, TrainingArguments
from sklearn.metrics import accuracy_score,f1_score

import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split

import re
import nltk
nltk.download('stopwords')
from nltk.corpus import stopwords
from nltk.stem.porter import PorterStemmer

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
    def keep_classifier_params(self):
        # Freeze all layers except the classifier
        for param in self.model.bert.parameters():
            param.requires_grad = False

        # Keep only the classification head trainable
        for param in self.model.classifier.parameters():
            param.requires_grad = True

        print(f"Trainable parameters: {sum(p.numel() for p in model.parameters() if p.requires_grad)}")

        
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
    
    def _clean_text(self):
        corpus = []
        len = 1000
        for i in range(len):
            statement = re.sub('[^a-zA-Z]',' ',len)
            statement = statement.lower()
            statement = statement.split()
            ps = PorterStemmer()

    
    def predict(self,text):
        """ Predict Hazard Type and Confidence """
        if self.model is None:
            raise ValueError("Model not Loaded")
        tokenzied_text = self.preprocess_text(text)

        with torch.no_grad():
            outputs = self.model(**tokenzied_text)
            prediction = torch.nn.functional.softmax(outputs.logits, dim=-1)

        prediction_class = torch.argmax(prediction,dim=-1).item()
        confidence = prediction[0][prediction_class].item() 

        return{
            "hazard_type": self.label_mapping[prediction_class],
            "confidence" : float(confidence),
            "all_probabilities": {
                self.label_mapping[i]: float(prob) for i,prob in enumerate(prediction[0])
            }
        }


    
class HazardXClassifierTrainer:
    def __init__(self):
        self.classifier = HazardClassifier


