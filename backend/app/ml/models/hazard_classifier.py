
import torch
from transformers import AutoModelForSequenceClassification, AutoTokenizer
from transformers import Trainer, TrainingArguments
from sklearn.metrics import accuracy_score,f1_score
from torch.utils.data import Dataset



import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split


import re
import nltk
nltk.download('stopwords')
from nltk.corpus import stopwords
from nltk.stem.porter import PorterStemmer


# df = pd.read_csv("../datasets/synthetic_hazard_dataset_1200.csv")
# ...existing code...
df = pd.read_csv("../datasets/synthetic_hazard_dataset_1200.csv")
# print(df.head())
# model_name = "bert-base-multilingual-cased"


# # Option 2: IndicBERT (better for Indian languages)
# model_name = "ai4bharat/indic-bert"

# # Option 3: XLM-RoBERTa (excellent multilingual performance)
# model_name = "xlm-roberta-base"

model_path = "FacebookAI/xlm-roberta-base"
# model_path = "ai4bharat/indic-bert"

class HazardDataset(Dataset):
    def __init__(self,texts,labels,tokenizer,max_length=128):
        self.texts = texts
        self.labels = labels
        self.tokenizer = tokenizer
        self.maz_length = max_length
    
    def __len__(self):
        return len(self.texts)

    def __getitem__(self, idx):
        text = self.texts[idx]
        label = self.labels[idx]
        encoding = self.tokenizer(
            text,
            truncation=True,
            padding='max_length',
            max_length=self.max_length,
            return_tensors='pt'
        )
        item = {key: val.squeeze(0) for key, val in encoding.items()}
        item['labels'] = torch.tensor(label, dtype=torch.long)
        return item


class HazardClassifier:
    def __init__(self):
        self.model_path = model_path
        self.tokenizer = AutoTokenizer.from_pretrained(model_path)
        self.model = None
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

    def load_model(self):
        self.model = AutoModelForSequenceClassification(model_path)
        self.model.eval()

    # def preprocess_text(self,text,max_length=512):
    #     """Preprocess and Tokenize Text"""
    #     # cleaned_text = self._clean_text(text)

    #     # Tokenize 
    #     tokenized_text = self.tokenizer(
    #         text,
    #         truncation = True,
    #         padding = True,
    #         max_length = max_length,
    #         return_tensors = "pt"
    #     )

    #     return tokenized_text
    
    # def _clean_text(self):
    #     corpus = []
    #     len = 1000
    #     for i in range(len):
    #         statement = re.sub('[^a-zA-Z]',' ',len)
    #         statement = statement.lower()
    #         statement = statement.split()
    #         ps = PorterStemmer()

    
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


    def prepare_dataset(self):
        """ Prepare dataset For Training """
        train_df, test_df = train_test_split(df, test_size=0.2, stratify=df['label'])

        train_dataset = HazardDataset(
            train_df['text_description'].tolist(),
            train_df['label'].tolist(),
            self.classifier.tokenizer
        )
        test_dataset = HazardDataset(
            test_df['text_description'],
            test_df['label'],
            self.classifier.tokenizer
        )

        return train_dataset,test_dataset
    
    def train_model(self,train_dataset,test_dataset,output_dir="../trained_models/hazard_model"):
        """ Fine Tuning the Model """
        model = AutoModelForSequenceClassification(
            self.classifier.model,
            num_labels = len(self.classifier.label_mapping)
            )
        # Training Arguments
        training_args = TrainingArguments(
            output_dir=output_dir,
            num_train_epochs=3,
            per_device_train_batch_size=16,
            per_device_eval_batch_size=16,
            warmup_steps=500,
            # logging_dir='./logs',
            weight_decay=0.01,
            evaluation_strategy="epoch",
            save_strategy="epoch",
            load_best_model_at_end=True,
            metric_for_best_model="f1",
        )
        # Initialize Trainer
        trainer = Trainer(
            model=model,
            args=training_args,
            train_dataset=train_dataset,
            eval_dataset=test_dataset,
            # compute_metrics=self.compute_metrics,
        )

        # Training
        trainer.train()

        # Save model
        trainer.save_model(output_dir)

        return trainer

    



# text = {}