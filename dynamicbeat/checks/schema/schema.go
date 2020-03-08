package schema

import (
	"context"
	"fmt"
	"time"
)

// A Check represents the configuration required to verify the operation of a
// single network service.
type Check interface {
	Run(ctx context.Context) CheckResult
	Init(id string, name string, group string, scoreWeight float64, def []byte) error
}

// CheckConfig contains the generic metadata about a check that all check types
// must have. It also includes the untemplated check-specific definition JSON
// string and any related attributes.
type CheckConfig struct {
	ID          string
	Name        string
	Type        string
	Group       string
	ScoreWeight float64
	Definition  []byte
	Attribs     map[string]string
}

// CheckResult : Information about the results of executing a check.
type CheckResult struct {
	Timestamp   time.Time
	ID          string
	Name        string
	Group       string
	ScoreWeight float64
	CheckType   string
	Passed      bool
	Message     string
	Details     map[string]string
}

// A ValidationError represents an issue with a check definition.
type ValidationError struct {
	ID    string // the ID of the check with an invalid definition
	Type  string // the type of the check with an invalid definition
	Field string // the field in the check definition that was invalid
}

func (v ValidationError) Error() string {
	return fmt.Sprintf("Error: check (Type: `%s`, ID: `%s`) is missing value for required field `%s`", v.Type, v.ID, v.Field)
}
