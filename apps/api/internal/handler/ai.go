package handler

import (
	"encoding/json"
	"math/rand"
	"net/http"
	"strings"
	"time"
)

type GenerateEffectRequest struct {
	Prompt string `json:"prompt"`
}

type GenerateEffectResponse struct {
	Effects   []GeneratedEffect `json:"effects"`
	Reasoning string            `json:"reasoning"`
}

type GeneratedEffect struct {
	Type   string             `json:"type"`
	Params map[string]float64 `json:"params"`
}

// Mood to effect mapping (simplified - in production use actual LLM)
var moodMappings = map[string][]GeneratedEffect{
	"dreamy": {
		{Type: "time-smear", Params: map[string]float64{"decay": 0.92, "intensity": 0.6}},
		{Type: "memory-fade", Params: map[string]float64{"fadeRate": 0.3, "desaturate": 0.4, "blur": 3}},
	},
	"anxious": {
		{Type: "breath-sync", Params: map[string]float64{"speed": 2.0, "intensity": 0.5}},
		{Type: "temporal-glitch", Params: map[string]float64{"frequency": 0.4, "intensity": 0.3}},
	},
	"nostalgic": {
		{Type: "memory-fade", Params: map[string]float64{"fadeRate": 0.6, "desaturate": 0.7, "blur": 5}},
		{Type: "echo-cascade", Params: map[string]float64{"copies": 2, "decay": 0.5, "offset": 200}},
	},
	"underwater": {
		{Type: "liquid-time", Params: map[string]float64{"speed": 0.6, "smoothness": 0.8}},
		{Type: "time-smear", Params: map[string]float64{"decay": 0.85, "intensity": 0.5}},
	},
	"glitch": {
		{Type: "temporal-glitch", Params: map[string]float64{"frequency": 0.7, "intensity": 0.8, "colorShift": 1}},
	},
	"slow": {
		{Type: "time-smear", Params: map[string]float64{"decay": 0.95, "intensity": 0.7}},
		{Type: "liquid-time", Params: map[string]float64{"speed": 0.4, "smoothness": 0.6}},
	},
	"psychedelic": {
		{Type: "echo-cascade", Params: map[string]float64{"copies": 5, "decay": 0.6, "offset": 150}},
		{Type: "temporal-glitch", Params: map[string]float64{"frequency": 0.5, "intensity": 0.6, "colorShift": 1}},
		{Type: "breath-sync", Params: map[string]float64{"speed": 1.5, "intensity": 0.4}},
	},
	"calm": {
		{Type: "breath-sync", Params: map[string]float64{"speed": 0.5, "intensity": 0.3}},
		{Type: "memory-fade", Params: map[string]float64{"fadeRate": 0.2, "desaturate": 0.2, "blur": 2}},
	},
}

func GenerateEffect(w http.ResponseWriter, r *http.Request) {
	var req GenerateEffectRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	if req.Prompt == "" {
		http.Error(w, "Prompt is required", http.StatusBadRequest)
		return
	}

	// Simple keyword matching (replace with LLM in production)
	prompt := strings.ToLower(req.Prompt)
	var matchedEffects []GeneratedEffect
	var reasoning string

	for keyword, effects := range moodMappings {
		if strings.Contains(prompt, keyword) {
			matchedEffects = append(matchedEffects, effects...)
			reasoning += keyword + " detected. "
		}
	}

	// Default fallback if no keywords matched
	if len(matchedEffects) == 0 {
		// Random effect with randomized params
		rand.Seed(time.Now().UnixNano())
		matchedEffects = []GeneratedEffect{
			{
				Type: "time-smear",
				Params: map[string]float64{
					"decay":     0.8 + rand.Float64()*0.15,
					"intensity": 0.4 + rand.Float64()*0.4,
				},
			},
		}
		reasoning = "No specific mood detected. Applied subtle time smear effect."
	}

	response := GenerateEffectResponse{
		Effects:   matchedEffects,
		Reasoning: reasoning,
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}

