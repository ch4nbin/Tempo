package handler

import (
	"encoding/json"
	"net/http"

	"github.com/go-chi/chi/v5"
)

// Available effects catalog
var availableEffects = []EffectDefinition{
	{
		ID:          "time-smear",
		Name:        "Time Smear",
		Description: "Motion trails that linger and fade over time",
		Category:    "temporal",
		Params: []ParamDefinition{
			{Name: "decay", Type: "float", Min: 0, Max: 1, Default: 0.9, Description: "How long trails persist"},
			{Name: "intensity", Type: "float", Min: 0, Max: 1, Default: 0.5, Description: "Trail opacity strength"},
		},
	},
	{
		ID:          "echo-cascade",
		Name:        "Echo Cascade",
		Description: "Recursive ghost copies offset in time",
		Category:    "temporal",
		Params: []ParamDefinition{
			{Name: "copies", Type: "int", Min: 1, Max: 10, Default: 3, Description: "Number of echo copies"},
			{Name: "decay", Type: "float", Min: 0, Max: 1, Default: 0.7, Description: "Opacity falloff per copy"},
			{Name: "offset", Type: "float", Min: 0, Max: 500, Default: 100, Description: "Time offset in ms"},
		},
	},
	{
		ID:          "liquid-time",
		Name:        "Liquid Time",
		Description: "Regions of video move at different speeds",
		Category:    "temporal",
		Params: []ParamDefinition{
			{Name: "speed", Type: "float", Min: 0.1, Max: 3, Default: 0.5, Description: "Time scale factor"},
			{Name: "smoothness", Type: "float", Min: 0, Max: 1, Default: 0.5, Description: "Transition smoothness"},
		},
	},
	{
		ID:          "temporal-glitch",
		Name:        "Temporal Glitch",
		Description: "Frames from past and future bleed through",
		Category:    "glitch",
		Params: []ParamDefinition{
			{Name: "frequency", Type: "float", Min: 0, Max: 1, Default: 0.3, Description: "How often glitches occur"},
			{Name: "intensity", Type: "float", Min: 0, Max: 1, Default: 0.5, Description: "Glitch strength"},
			{Name: "colorShift", Type: "bool", Min: 0, Max: 1, Default: 1, Description: "Enable color channel separation"},
		},
	},
	{
		ID:          "breath-sync",
		Name:        "Breath Sync",
		Description: "Video pulses and breathes rhythmically",
		Category:    "rhythm",
		Params: []ParamDefinition{
			{Name: "speed", Type: "float", Min: 0.1, Max: 3, Default: 1, Description: "Breathing rate"},
			{Name: "intensity", Type: "float", Min: 0, Max: 1, Default: 0.5, Description: "Pulse intensity"},
			{Name: "pattern", Type: "string", Min: 0, Max: 0, Default: 0, Description: "smooth or erratic"},
		},
	},
	{
		ID:          "memory-fade",
		Name:        "Memory Fade",
		Description: "Older frames progressively desaturate and blur",
		Category:    "temporal",
		Params: []ParamDefinition{
			{Name: "fadeRate", Type: "float", Min: 0, Max: 1, Default: 0.5, Description: "How fast memory fades"},
			{Name: "desaturate", Type: "float", Min: 0, Max: 1, Default: 0.7, Description: "Color loss amount"},
			{Name: "blur", Type: "float", Min: 0, Max: 20, Default: 5, Description: "Blur amount in pixels"},
		},
	},
}

type EffectDefinition struct {
	ID          string            `json:"id"`
	Name        string            `json:"name"`
	Description string            `json:"description"`
	Category    string            `json:"category"`
	Params      []ParamDefinition `json:"params"`
}

type ParamDefinition struct {
	Name        string  `json:"name"`
	Type        string  `json:"type"`
	Min         float64 `json:"min"`
	Max         float64 `json:"max"`
	Default     float64 `json:"default"`
	Description string  `json:"description"`
}

func ListEffects(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"effects": availableEffects,
		"total":   len(availableEffects),
	})
}

func GetEffect(w http.ResponseWriter, r *http.Request) {
	effectID := chi.URLParam(r, "effectID")

	for _, effect := range availableEffects {
		if effect.ID == effectID {
			w.Header().Set("Content-Type", "application/json")
			json.NewEncoder(w).Encode(effect)
			return
		}
	}

	http.Error(w, "Effect not found", http.StatusNotFound)
}

