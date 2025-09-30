package eino

// JSON 解析辅助函数

// GetStringFromJSON 从 JSON 数据中获取字符串值
func GetStringFromJSON(data map[string]interface{}, key string) string {
	if val, ok := data[key]; ok {
		if str, ok := val.(string); ok {
			return str
		}
	}
	return ""
}

// GetIntFromJSON 从 JSON 数据中获取整数值
func GetIntFromJSON(data map[string]interface{}, key string) int {
	if val, ok := data[key]; ok {
		switch v := val.(type) {
		case int:
			return v
		case float64:
			return int(v)
		}
	}
	return 0
}

// GetBoolFromJSON 从 JSON 数据中获取布尔值
func GetBoolFromJSON(data map[string]interface{}, key string) bool {
	if val, ok := data[key]; ok {
		if b, ok := val.(bool); ok {
			return b
		}
	}
	return false
}

// GetStringArrayFromJSON 从 JSON 数据中获取字符串数组
func GetStringArrayFromJSON(data map[string]interface{}, key string) []string {
	if val, ok := data[key]; ok {
		if arr, ok := val.([]interface{}); ok {
			var result []string
			for _, item := range arr {
				if str, ok := item.(string); ok {
					result = append(result, str)
				}
			}
			return result
		}
	}
	return []string{}
}

// GetStringMapFromJSON 从 JSON 数据中获取字符串映射
func GetStringMapFromJSON(data map[string]interface{}, key string) map[string]string {
	if val, ok := data[key]; ok {
		if m, ok := val.(map[string]interface{}); ok {
			result := make(map[string]string)
			for k, v := range m {
				if str, ok := v.(string); ok {
					result[k] = str
				}
			}
			return result
		}
	}
	return map[string]string{}
}